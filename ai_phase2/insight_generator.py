"""
RiskLens Phase 2 — Step 6: Insight Generator
Converts risk metrics and portfolio intelligence into human-readable insights.
"""

from typing import Dict, Any, List


class InsightGenerator:
    """
    Rule-based engine that generates plain-language insights
    from Phase 2 risk analysis results.
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        per_asset: Dict[str, Dict],
        portfolio_intel: Dict[str, Any],
        portfolio_weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Generate insights from risk metrics and portfolio intelligence.

        Args:
            per_asset:         Per-asset risk metrics.
            portfolio_intel:   Portfolio-level intelligence.
            portfolio_weights: Optional { symbol: weight_fraction } for allocation comparison.

        Returns:
            {
                "asset_insights":     [ { symbol, category, severity, message } ],
                "portfolio_insights": [ { category, severity, message } ],
                "summary":            str
            }
        """
        asset_insights = self._asset_insights(per_asset)
        portfolio_insights = self._portfolio_insights(portfolio_intel, portfolio_weights)
        summary = self._generate_summary(per_asset, portfolio_intel)

        return {
            "asset_insights": asset_insights,
            "portfolio_insights": portfolio_insights,
            "summary": summary
        }

    # ------------------------------------------------------------------
    # Asset-level insights
    # ------------------------------------------------------------------

    def _asset_insights(self, per_asset: Dict[str, Dict]) -> List[Dict]:
        insights = []

        for symbol, metrics in per_asset.items():
            vol = metrics.get("volatility_pct", 0)
            dd = metrics.get("max_drawdown_pct", 0)
            sharpe = metrics.get("sharpe_ratio", 0)

            # --- Volatility insights ---
            if vol > 50:
                insights.append({
                    "symbol": symbol,
                    "category": "volatility",
                    "severity": "critical",
                    "message": f"⚠️ {symbol} has extremely high volatility ({vol}%). "
                               f"This asset is very unpredictable and can cause significant portfolio swings."
                })
            elif vol > 30:
                insights.append({
                    "symbol": symbol,
                    "category": "volatility",
                    "severity": "warning",
                    "message": f"🔶 {symbol} has high volatility ({vol}%). "
                               f"Consider reducing exposure if you have a conservative risk profile."
                })
            elif vol < 10:
                insights.append({
                    "symbol": symbol,
                    "category": "volatility",
                    "severity": "info",
                    "message": f"✅ {symbol} has low volatility ({vol}%). "
                               f"This is a stable asset in your portfolio."
                })

            # --- Drawdown insights ---
            if dd < -30:
                insights.append({
                    "symbol": symbol,
                    "category": "drawdown",
                    "severity": "critical",
                    "message": f"🔻 {symbol} experienced a {abs(dd)}% maximum drawdown. "
                               f"This means you could have lost nearly a third of your investment."
                })
            elif dd < -15:
                insights.append({
                    "symbol": symbol,
                    "category": "drawdown",
                    "severity": "warning",
                    "message": f"📉 {symbol} had a notable {abs(dd)}% drawdown. "
                               f"Monitor closely during market downturns."
                })

            # --- Sharpe ratio insights ---
            if sharpe < 0:
                insights.append({
                    "symbol": symbol,
                    "category": "performance",
                    "severity": "warning",
                    "message": f"📊 {symbol} has a negative Sharpe ratio ({sharpe}). "
                               f"Its returns don't compensate for the risk taken."
                })
            elif sharpe > 2:
                insights.append({
                    "symbol": symbol,
                    "category": "performance",
                    "severity": "info",
                    "message": f"🌟 {symbol} has an excellent risk-adjusted return (Sharpe: {sharpe}). "
                               f"Strong performer relative to risk."
                })

        return insights

    # ------------------------------------------------------------------
    # Portfolio-level insights
    # ------------------------------------------------------------------

    def _portfolio_insights(self, portfolio_intel: Dict[str, Any], portfolio_weights: Dict[str, float] = None) -> List[Dict]:
        insights = []

        port_vol = portfolio_intel.get("portfolio_volatility_pct", 0)
        div_ratio = portfolio_intel.get("diversification_ratio", 1.0)
        high_corr = portfolio_intel.get("high_correlation_pairs", [])
        risk_contribs = portfolio_intel.get("risk_contributions", {})

        # --- Portfolio volatility ---
        if port_vol > 30:
            insights.append({
                "category": "portfolio_risk",
                "severity": "critical",
                "message": f"⚠️ Your portfolio volatility is {port_vol}%. "
                           f"This is very high — expect significant value fluctuations."
            })
        elif port_vol > 20:
            insights.append({
                "category": "portfolio_risk",
                "severity": "warning",
                "message": f"🔶 Your portfolio volatility is {port_vol}%. "
                           f"Moderate risk — suitable for balanced investors."
            })
        else:
            insights.append({
                "category": "portfolio_risk",
                "severity": "info",
                "message": f"✅ Your portfolio volatility is {port_vol}%. "
                           f"Relatively stable portfolio."
            })

        # --- Diversification ---
        if div_ratio < 1.1:
            insights.append({
                "category": "diversification",
                "severity": "warning",
                "message": f"📊 Diversification ratio is only {div_ratio}. "
                           f"Your assets move together — you're not benefiting from diversification. "
                           f"Consider adding uncorrelated assets like bonds or commodities."
            })
        elif div_ratio >= 1.1 and div_ratio <= 1.5:
            insights.append({
                "category": "diversification",
                "severity": "info",
                "message": f"📊 Diversification ratio is {div_ratio} — reasonable, "
                           f"but there's room to improve by adding more uncorrelated holdings."
            })
        elif div_ratio > 1.5:
            insights.append({
                "category": "diversification",
                "severity": "info",
                "message": f"✅ Diversification ratio is {div_ratio}. "
                           f"Strong diversification — your assets meaningfully offset each other's risk."
            })

        # --- Correlation warnings ---
        if high_corr:
            for pair in high_corr:
                sym1, sym2, corr = pair[0], pair[1], pair[2]
                insights.append({
                    "category": "correlation",
                    "severity": "warning",
                    "message": f"🔗 {sym1} and {sym2} are highly correlated ({corr:.2f}). "
                               f"They tend to move together, reducing diversification benefit."
                })
        else:
            insights.append({
                "category": "correlation",
                "severity": "info",
                "message": "✅ No high correlation detected between your assets. "
                           "This is positive — your holdings don't move in lockstep."
            })

        # --- Concentration risk (with allocation comparison) ---
        if risk_contribs:
            max_contrib_sym = max(risk_contribs, key=risk_contribs.get)
            max_contrib_val = risk_contribs[max_contrib_sym]

            if max_contrib_val > 60:
                # Critical: one asset dominates risk
                alloc_note = ""
                if portfolio_weights and max_contrib_sym in portfolio_weights:
                    alloc_pct = round(portfolio_weights[max_contrib_sym] * 100, 1)
                    alloc_note = (
                        f" Despite being only {alloc_pct}% of your portfolio by value, "
                        f"it contributes {max_contrib_val}% of total risk."
                    )
                insights.append({
                    "category": "concentration",
                    "severity": "critical",
                    "message": f"🚨 {max_contrib_sym} dominates your portfolio risk at {max_contrib_val}%.{alloc_note} "
                               f"This single asset is the primary driver of portfolio losses."
                })
            elif max_contrib_val > 40:
                insights.append({
                    "category": "concentration",
                    "severity": "warning",
                    "message": f"🎯 {max_contrib_sym} contributes {max_contrib_val}% of your total portfolio risk. "
                               f"Consider rebalancing to reduce concentration."
                })

        return insights

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _generate_summary(
        self,
        per_asset: Dict[str, Dict],
        portfolio_intel: Dict[str, Any]
    ) -> str:
        """Generate a one-paragraph portfolio summary."""

        port_vol = portfolio_intel.get("portfolio_volatility_pct", 0)
        div_ratio = portfolio_intel.get("diversification_ratio", 1.0)
        high_corr_count = len(portfolio_intel.get("high_correlation_pairs", []))
        asset_count = len(per_asset)

        # Find highest and lowest vol assets
        if per_asset:
            sorted_by_vol = sorted(per_asset.items(), key=lambda x: x[1]["volatility_pct"])
            safest = sorted_by_vol[0][0]
            riskiest = sorted_by_vol[-1][0]

            summary = (
                f"Your portfolio of {asset_count} assets has an overall volatility of {port_vol}% "
                f"with a diversification ratio of {div_ratio}. "
                f"{riskiest} is your riskiest holding with {per_asset[riskiest]['volatility_pct']}% volatility, "
                f"while {safest} is the most stable at {per_asset[safest]['volatility_pct']}%. "
            )

            if high_corr_count > 0:
                summary += f"There {'are' if high_corr_count > 1 else 'is'} {high_corr_count} highly correlated asset pair{'s' if high_corr_count > 1 else ''} that may limit diversification benefits."
            else:
                summary += "No significant correlation clusters were detected — good diversification."
        else:
            summary = "Unable to generate summary — no risk data available."

        return summary


# ------------------------------------------------------------------
# Quick test
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("RiskLens Phase 2 — Insight Generator Test\n")

    # Sample data (would normally come from previous pipeline stages)
    per_asset = {
        "AAPL": {"volatility_pct": 22.5, "max_drawdown_pct": -12.3, "sharpe_ratio": 1.2},
        "BTC":  {"volatility_pct": 55.0, "max_drawdown_pct": -35.0, "sharpe_ratio": 0.3},
        "Gold": {"volatility_pct": 12.0, "max_drawdown_pct": -5.0,  "sharpe_ratio": 0.8},
    }

    portfolio_intel = {
        "portfolio_volatility_pct": 28.5,
        "diversification_ratio": 1.35,
        "risk_contributions": {"AAPL": 30.0, "BTC": 55.0, "Gold": 15.0},
        "high_correlation_pairs": [["AAPL", "BTC", 0.72]],
    }

    generator = InsightGenerator()
    result = generator.generate(per_asset, portfolio_intel)

    print("=== Asset Insights ===")
    for insight in result["asset_insights"]:
        print(f"  [{insight['severity'].upper()}] {insight['message']}")

    print("\n=== Portfolio Insights ===")
    for insight in result["portfolio_insights"]:
        print(f"  [{insight['severity'].upper()}] {insight['message']}")

    print(f"\n=== Summary ===\n  {result['summary']}")
