"""
RiskLens Phase 3: Behavioral Intelligence Engine
Analyzes user interactions to personalize risk insights.

Key capabilities:
  - Per-asset-class preference tracking (accept/reject rates for crypto, bonds, etc.)
  - Profile drift detection (stated vs. actual behavior)
  - LLM context generation for personalized explanations
"""

from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger("risklens.ai.phase3")

# Asset classes ranked by typical risk (low → high)
RISK_RANK = {
    "bond": 1,
    "commodity": 2,
    "etf": 3,
    "stock": 4,
    "crypto": 5,
}

# Profile → expected preference direction
PROFILE_EXPECTATIONS = {
    "conservative": {"preferred": {"bond", "commodity"}, "cautious": {"crypto", "stock"}},
    "balanced":     {"preferred": {"stock", "etf", "commodity"}, "cautious": {"crypto"}},
    "aggressive":   {"preferred": {"crypto", "stock"}, "cautious": {"bond"}},
}


class BehavioralEngine:
    """
    Learns from user feedback (Accept/Reject/Modify/Ignore) to refine the AI's
    risk perspective and generate personalized context for the LLM.
    """

    def __init__(self, historical_interactions: List[Dict], decision_logs: Optional[List[Dict]] = None):
        """
        Args:
            historical_interactions: List of user_interactions docs from MongoDB.
            decision_logs: List of decision_logs docs (portfolio analyses) for
                           cross-referencing which assets were in each snapshot.
        """
        self.interactions = historical_interactions
        self.decision_logs = decision_logs or []

        # Build a lookup: snapshot_hash → list of asset types in that portfolio
        self._snapshot_assets: Dict[str, List[str]] = {}
        for log in self.decision_logs:
            snap = log.get("snapshot_hash")
            ai_data = log.get("ai_analysis", {})
            summary = ai_data.get("summary", {})
            assets_info = summary.get("assets", [])

            if snap and assets_info:
                self._snapshot_assets[snap] = [
                    a.get("type", "unknown").lower() for a in assets_info
                ]

    # ------------------------------------------------------------------
    # Core: Personalization Offset
    # ------------------------------------------------------------------

    def calculate_personalization_offset(self, stated_profile: str) -> Dict[str, Any]:
        """
        Compare stated profile vs actual behavior and return an offset.

        Returns:
            {
                "score_offset": float,        # Adjustment to risk score
                "profile_drift": str,         # "more_aggressive", "more_conservative", "aligned"
                "drift_direction": str,       # Human-readable drift description
                "confidence": float,          # 0.0 to 1.0 based on data volume
                "per_class_rates": dict,      # Accept rate per asset class
                "behavioral_summary": str     # Human-readable summary for LLM
            }
        """
        if not self.interactions:
            return {
                "score_offset": 0.0,
                "profile_drift": "aligned",
                "drift_direction": "No behavioral data yet",
                "confidence": 0.0,
                "per_class_rates": {},
                "behavioral_summary": "No historical behavior data yet. Using baseline profile."
            }

        # --- Global counts ---
        counts = {"accept": 0, "reject": 0, "modify": 0, "ignore": 0}
        for inter in self.interactions:
            action = inter.get("action", "ignore").lower()
            counts[action] = counts.get(action, 0) + 1

        total = sum(counts.values())
        accept_rate = counts["accept"] / total if total > 0 else 0
        reject_rate = counts["reject"] / total if total > 0 else 0

        # --- Per-asset-class preference analysis ---
        per_class = self._compute_per_class_rates()

        # --- Drift detection ---
        drift, drift_direction, offset = self._detect_drift(
            stated_profile.lower(), per_class, accept_rate, reject_rate
        )

        confidence = min(total / 10, 1.0)  # 10 feedback items = 100% confidence

        summary = self._build_summary(
            total, counts, accept_rate, drift, drift_direction, per_class
        )

        return {
            "score_offset": round(offset, 2),
            "profile_drift": drift,
            "drift_direction": drift_direction,
            "confidence": confidence,
            "per_class_rates": per_class,
            "behavioral_summary": summary
        }

    # ------------------------------------------------------------------
    # Per-Class Rates
    # ------------------------------------------------------------------

    def _compute_per_class_rates(self) -> Dict[str, Dict[str, Any]]:
        """
        Compute accept/reject rates per asset class by cross-referencing
        interactions with decision logs.

        Returns:
            {
                "crypto": {"accept": 5, "reject": 1, "total": 6, "accept_rate": 0.83},
                "bond":   {"accept": 1, "reject": 4, "total": 5, "accept_rate": 0.20},
                ...
            }
        """
        class_counts: Dict[str, Dict[str, int]] = {}

        for inter in self.interactions:
            snap = inter.get("snapshot_hash", "")
            action = inter.get("action", "ignore").lower()

            asset_types = self._snapshot_assets.get(snap, [])

            if not asset_types:
                # If we can't resolve the snapshot, skip per-class tracking
                continue

            for atype in asset_types:
                if atype not in class_counts:
                    class_counts[atype] = {"accept": 0, "reject": 0, "modify": 0, "ignore": 0}
                class_counts[atype][action] = class_counts[atype].get(action, 0) + 1

        # Compute rates
        result = {}
        for cls, c in class_counts.items():
            t = sum(c.values())
            result[cls] = {
                "accept": c.get("accept", 0),
                "reject": c.get("reject", 0),
                "modify": c.get("modify", 0),
                "ignore": c.get("ignore", 0),
                "total": t,
                "accept_rate": round(c.get("accept", 0) / t, 2) if t > 0 else 0
            }

        return result

    # ------------------------------------------------------------------
    # Drift Detection
    # ------------------------------------------------------------------

    def _detect_drift(
        self,
        stated_profile: str,
        per_class: Dict[str, Dict],
        global_accept_rate: float,
        global_reject_rate: float
    ) -> tuple:
        """
        Detect whether user's behavior drifts from their stated profile.

        Returns: (drift_label, drift_description, score_offset)
        """
        expectations = PROFILE_EXPECTATIONS.get(stated_profile, PROFILE_EXPECTATIONS["balanced"])
        preferred_classes = expectations["preferred"]
        cautious_classes = expectations["cautious"]

        # Check: Does user accept high-risk assets they should be cautious about?
        risky_accept_rate = 0.0
        risky_count = 0
        for cls in cautious_classes:
            if cls in per_class:
                risky_accept_rate += per_class[cls]["accept_rate"]
                risky_count += 1

        # Check: Does user reject safe assets they should prefer?
        safe_reject_rate = 0.0
        safe_count = 0
        for cls in preferred_classes:
            if cls in per_class:
                rejects = per_class[cls]["reject"]
                total = per_class[cls]["total"]
                safe_reject_rate += (rejects / total) if total > 0 else 0
                safe_count += 1

        avg_risky_accept = (risky_accept_rate / risky_count) if risky_count > 0 else 0
        avg_safe_reject = (safe_reject_rate / safe_count) if safe_count > 0 else 0

        # Determine drift
        if avg_risky_accept > 0.6 and stated_profile == "conservative":
            return (
                "more_aggressive",
                f"You state a Conservative profile, but accept {avg_risky_accept*100:.0f}% of high-risk recommendations. "
                f"Your behavior aligns more with a Balanced or Aggressive profile.",
                3.0  # Nudge risk score up slightly (on 0-5 scale)
            )
        elif avg_risky_accept > 0.5 and stated_profile == "balanced":
            return (
                "more_aggressive",
                f"You accept {avg_risky_accept*100:.0f}% of high-risk asset recommendations, "
                f"suggesting a more aggressive appetite than your Balanced profile indicates.",
                1.5
            )
        elif avg_safe_reject > 0.5 and stated_profile in ("conservative", "balanced"):
            return (
                "more_aggressive",
                f"You reject {avg_safe_reject*100:.0f}% of safe-asset recommendations, "
                f"suggesting you prefer higher-risk options.",
                2.0
            )
        elif avg_risky_accept < 0.3 and stated_profile == "aggressive":
            return (
                "more_conservative",
                f"You state an Aggressive profile, but only accept {avg_risky_accept*100:.0f}% of high-risk recommendations. "
                f"Your actions suggest a more conservative approach.",
                -2.0  # Nudge risk score down
            )
        elif global_reject_rate > 0.6:
            return (
                "divergent",
                f"You reject {global_reject_rate*100:.0f}% of all AI suggestions. "
                f"The AI may not be calibrated to your preferences yet.",
                -1.0
            )
        elif global_accept_rate > 0.8:
            return (
                "highly_aligned",
                f"You follow {global_accept_rate*100:.0f}% of AI recommendations — strong alignment with your {stated_profile} profile.",
                0.5
            )
        else:
            return (
                "aligned",
                f"Your behavior is broadly consistent with your {stated_profile} profile.",
                0.0
            )

    # ------------------------------------------------------------------
    # Summary Builder
    # ------------------------------------------------------------------

    def _build_summary(
        self,
        total: int,
        counts: Dict[str, int],
        accept_rate: float,
        drift: str,
        drift_direction: str,
        per_class: Dict
    ) -> str:
        """Build a human-readable behavioral summary."""
        parts = [
            f"Based on {total} interactions "
            f"({counts['accept']} accepted, {counts['reject']} rejected, "
            f"{counts.get('modify', 0)} modified, {counts.get('ignore', 0)} ignored)."
        ]

        if per_class:
            # Highlight the most and least accepted class
            sorted_classes = sorted(per_class.items(), key=lambda x: x[1]["accept_rate"], reverse=True)
            if sorted_classes:
                top = sorted_classes[0]
                parts.append(
                    f"Highest acceptance: {top[0]} ({top[1]['accept_rate']*100:.0f}% accept rate)."
                )
            if len(sorted_classes) > 1:
                bottom = sorted_classes[-1]
                parts.append(
                    f"Lowest acceptance: {bottom[0]} ({bottom[1]['accept_rate']*100:.0f}% accept rate)."
                )

        if drift != "aligned":
            parts.append(f"Profile drift detected: {drift_direction}")

        return " ".join(parts)

    # ------------------------------------------------------------------
    # LLM Context Generator
    # ------------------------------------------------------------------

    def generate_llm_context(self, stated_profile: str) -> Optional[str]:
        """
        Produce a structured context string for the LLM prompt to enable
        personalized explanations.

        Returns None if insufficient data.
        """
        if len(self.interactions) < 3:
            return None

        offset_data = self.calculate_personalization_offset(stated_profile)

        if offset_data["confidence"] < 0.3:
            return None

        lines = [
            f"User's stated risk profile: {stated_profile.capitalize()}",
            f"Total interactions analyzed: {len(self.interactions)}",
            f"Overall acceptance rate: {offset_data['per_class_rates'] and 'see below' or 'N/A'}",
            f"Profile drift: {offset_data['profile_drift']} — {offset_data['drift_direction']}",
        ]

        per_class = offset_data.get("per_class_rates", {})
        if per_class:
            lines.append("Per-asset-class behavior:")
            for cls, rates in sorted(per_class.items()):
                lines.append(
                    f"  - {cls.capitalize()}: {rates['accept_rate']*100:.0f}% accept rate "
                    f"({rates['accept']} accepted, {rates['reject']} rejected out of {rates['total']})"
                )

        lines.append("")
        lines.append(
            "INSTRUCTION: Use this behavioral data to personalize your tone and recommendations. "
            "If the user's behavior contradicts their stated profile, gently acknowledge this and "
            "tailor suggestions to their ACTUAL comfort level, not just the stated one."
        )

        return "\n".join(lines)
