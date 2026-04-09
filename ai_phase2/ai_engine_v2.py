"""
RiskLens Phase 2 — Step 5: AI Engine v2
Integrates Phase 1 (deterministic) and Phase 2 (market-data) analysis.
"""

import sys
import os
import json
from typing import Dict, Any

# Add project root to path so we can import Phase 1
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from ai_phase1.ai_engine import PortfolioAI
from ai_phase2.data_collector import MarketDataCollector
from ai_phase2.feature_engine import FeatureEngine
from ai_phase2.risk_metrics import RiskMetrics
from ai_phase2.portfolio_intelligence import PortfolioIntelligence
from ai_phase2.insight_generator import InsightGenerator


class PortfolioAIv2:
    """
    Enhanced AI engine combining Phase 1 (rule-based) and Phase 2 (data-driven) analysis.

    Risk Scale (0–5):
        0.0 – 1.0  →  Low Risk
        1.0 – 3.0  →  Moderate Risk
        3.0 – 5.0  →  High Risk

    Pipeline:
        Portfolio → Phase 1 Analysis
                  → Market Data → Features → Risk Metrics → Portfolio Intelligence → Insights
                  → Merged Result
    """

    PHASE1_WEIGHT = 0.4
    PHASE2_WEIGHT = 0.6

    # Risk scale boundaries (0–5)
    RISK_SCALE = {
        "min": 0,
        "max": 5,
        "thresholds": {"low": 1.0, "moderate": 3.0, "high": 5.0}
    }

    def __init__(self, portfolio_data: Dict, risk_profile: str = "balanced", lookback_days: int = 90):
        self.portfolio = portfolio_data
        self.risk_profile = risk_profile
        self.lookback_days = lookback_days

    # ------------------------------------------------------------------
    # Main pipeline
    # ------------------------------------------------------------------

    def analyze(self) -> Dict[str, Any]:
        """
        Run the full Phase 1 + Phase 2 analysis pipeline.

        Returns combined result with both phases merged.
        Falls back to Phase 1 only if market data is unavailable.
        """
        # --- Phase 1 ---
        phase1_engine = PortfolioAI(self.portfolio, self.risk_profile)
        phase1_result = phase1_engine.analyze()

        # --- Phase 2 ---
        try:
            phase2_result = self._run_market_analysis()
        except Exception as e:
            print(f"[WARN] Phase 2 analysis failed: {e}. Using Phase 1 only.")
            phase1_result["phase2"] = None
            phase1_result["combined_risk_score"] = phase1_result["risk"]["risk_score"]
            return phase1_result

        # --- Merge ---
        return self._merge_results(phase1_result, phase2_result)

    # ------------------------------------------------------------------
    # Phase 2 sub-pipeline
    # ------------------------------------------------------------------

    def _run_market_analysis(self) -> Dict[str, Any]:
        """Execute the Phase 2 data pipeline."""

        # Step 1: Collect market data
        collector = MarketDataCollector(lookback_days=self.lookback_days)
        market_data = collector.fetch_from_portfolio(self.portfolio)

        if not market_data:
            raise ValueError("No market data could be fetched for any asset.")

        # Step 2: Feature engineering
        engine = FeatureEngine()
        features = engine.engineer(market_data)

        if not features:
            raise ValueError("Feature engineering produced no results.")

        # Step 3: Risk metrics
        risk_calc = RiskMetrics()
        risk_result = risk_calc.calculate(features)

        # Step 4: Portfolio intelligence
        intel = PortfolioIntelligence()
        portfolio_intel = intel.analyze(risk_result, self.portfolio)

        # Compute weights for insight comparison
        assets = self.portfolio.get("assets", [])
        total_val = sum(a["value"] for a in assets)
        portfolio_weights = {a["symbol"]: a["value"] / total_val for a in assets} if total_val > 0 else {}

        # Step 6: Insights (with weights for allocation-vs-risk comparison)
        insight_gen = InsightGenerator()
        insights = insight_gen.generate(risk_result["per_asset"], portfolio_intel, portfolio_weights)

        return {
            "per_asset_metrics": risk_result["per_asset"],
            "correlation_matrix": risk_result["correlation_matrix"],
            "portfolio_intelligence": portfolio_intel,
            "insights": insights
        }

    # ------------------------------------------------------------------
    # Merge Phase 1 + Phase 2
    # ------------------------------------------------------------------

    def _merge_results(self, phase1: Dict, phase2: Dict) -> Dict[str, Any]:
        """Combine Phase 1 and Phase 2 into a unified result."""

        # Compute Phase 2 risk score (0–5 scale like Phase 1)
        port_vol = phase2["portfolio_intelligence"]["portfolio_volatility_pct"]
        phase2_score = self._vol_to_risk_score(port_vol)

        # Combined score
        phase1_score = phase1["risk"]["risk_score"]
        combined = round(
            self.PHASE1_WEIGHT * phase1_score + self.PHASE2_WEIGHT * phase2_score,
            2
        )

        # Risk level from combined score (0–5 scale)
        combined_level = self._score_to_level(combined)

        return {
            # Phase 1 data
            "summary": phase1["summary"],
            "diversification": phase1["diversification"],
            "rebalancing": phase1["rebalancing"],

            # Phase 1 risk (original)
            "phase1_risk": phase1["risk"],

            # Phase 2 data
            "phase2": {
                "per_asset_metrics": phase2["per_asset_metrics"],
                "correlation_matrix": phase2["correlation_matrix"],
                "portfolio_intelligence": phase2["portfolio_intelligence"],
                "insights": phase2["insights"],
                "market_risk_score": phase2_score,
            },

            # Combined
            "risk": {
                "risk_score": combined,
                "risk_level": combined_level,
                "scale": self.RISK_SCALE,
                "phase1_score": phase1_score,
                "phase2_score": phase2_score,
                "phase1_weight": self.PHASE1_WEIGHT,
                "phase2_weight": self.PHASE2_WEIGHT,
                "explanation": (
                    f"Combined risk = {self.PHASE1_WEIGHT}×Phase1({phase1_score}) "
                    f"+ {self.PHASE2_WEIGHT}×Phase2({phase2_score}) = {combined}. "
                    f"Scale: 0-1 Low, 1-3 Moderate, 3-5 High."
                )
            }
        }

    @staticmethod
    def _score_to_level(score: float) -> str:
        """Map 0–5 risk score to human-readable level."""
        if score < 1.0:
            return "Low"
        elif score < 3.0:
            return "Moderate"
        else:
            return "High"

    def _vol_to_risk_score(self, vol_pct: float) -> float:
        """
        Map portfolio volatility percentage to a 0–5 risk score.

        Scale:
            0–10%   vol → 0.0–1.0 score (Low)
            10–25%  vol → 1.0–3.0 score (Moderate)
            25–50%+ vol → 3.0–5.0 score (High)
        """
        if vol_pct <= 0:
            return 0.0
        elif vol_pct <= 10:
            return round((vol_pct / 10) * 1.0, 2)
        elif vol_pct <= 25:
            return round(1.0 + ((vol_pct - 10) / 15) * 2.0, 2)
        elif vol_pct <= 50:
            return round(3.0 + ((vol_pct - 25) / 25) * 2.0, 2)
        else:
            return 5.0


# ------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("RiskLens Phase 2 — AI Engine v2 (Full Pipeline)\n")
    print("=" * 60)

    sample_portfolio = {
        "assets": [
            {"symbol": "AAPL", "type": "stock", "value": 20000},
            {"symbol": "BTC", "type": "crypto", "value": 15000},
            {"symbol": "Gold", "type": "commodity", "value": 5000},
            {"symbol": "US Bonds", "type": "bond", "value": 10000},
        ]
    }

    ai = PortfolioAIv2(sample_portfolio, risk_profile="balanced")
    result = ai.analyze()

    print(json.dumps(result, indent=4))
