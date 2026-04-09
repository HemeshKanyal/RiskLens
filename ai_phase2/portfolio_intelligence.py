"""
RiskLens Phase 2 — Step 4: Portfolio Intelligence
Uses correlation + volatility to assess portfolio-level risk.
"""

import numpy as np
from typing import Dict, Any, List, Tuple


class PortfolioIntelligence:
    """
    Portfolio-level risk analysis using per-asset metrics and correlations.
    """

    HIGH_CORR_THRESHOLD = 0.7  # Pairs above this are flagged

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(
        self,
        risk_result: Dict[str, Any],
        portfolio_data: Dict
    ) -> Dict[str, Any]:
        """
        Compute portfolio-level intelligence.

        Args:
            risk_result:    Output from RiskMetrics.calculate()
            portfolio_data: Original portfolio { "assets": [...] }

        Returns:
            {
                "portfolio_volatility_pct":  float,
                "diversification_ratio":     float,
                "risk_contributions":        { symbol: pct },
                "high_correlation_pairs":    [ (sym1, sym2, corr) ],
            }
        """
        per_asset = risk_result["per_asset"]
        corr_matrix = risk_result["correlation_matrix"]

        # Build weights and volatilities from portfolio
        weights, vols = self._extract_weights_and_vols(per_asset, portfolio_data)

        if not weights:
            return {
                "portfolio_volatility_pct": 0.0,
                "diversification_ratio": 1.0,
                "risk_contributions": {},
                "high_correlation_pairs": [],
            }

        symbols = list(weights.keys())

        # 1. Portfolio volatility (considering correlations)
        port_vol = self._portfolio_volatility(symbols, weights, vols, corr_matrix)

        # 2. Diversification ratio
        weighted_sum_vols = sum(weights[s] * vols[s] for s in symbols)
        div_ratio = round(weighted_sum_vols / port_vol, 2) if port_vol > 0 else 1.0

        # 3. Risk contributions (marginal)
        risk_contribs = self._risk_contributions(symbols, weights, vols, corr_matrix, port_vol)

        # 4. High-correlation pairs
        high_corr = self._high_correlation_pairs(corr_matrix)

        return {
            "portfolio_volatility_pct": round(port_vol * 100, 2),
            "diversification_ratio": div_ratio,
            "risk_contributions": risk_contribs,
            "high_correlation_pairs": high_corr,
        }

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _extract_weights_and_vols(
        self,
        per_asset: Dict[str, Dict],
        portfolio_data: Dict
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        """
        Extract portfolio weights and volatilities.
        Only includes assets that have both portfolio value AND risk metrics.
        """
        assets = portfolio_data.get("assets", [])
        total = sum(a["value"] for a in assets)
        if total <= 0:
            return {}, {}

        weights = {}
        vols = {}

        for asset in assets:
            sym = asset["symbol"]
            if sym in per_asset:
                weights[sym] = asset["value"] / total
                vols[sym] = per_asset[sym]["volatility_pct"] / 100  # Convert back to decimal

        return weights, vols

    def _portfolio_volatility(
        self,
        symbols: List[str],
        weights: Dict[str, float],
        vols: Dict[str, float],
        corr_matrix: Dict[str, Dict[str, float]]
    ) -> float:
        """
        Portfolio volatility = sqrt( w^T * Σ * w )
        where Σ is the covariance matrix built from vols and correlations.
        """
        n = len(symbols)
        variance = 0.0

        for i in range(n):
            for j in range(n):
                si, sj = symbols[i], symbols[j]
                wi, wj = weights[si], weights[sj]
                vi, vj = vols[si], vols[sj]

                # Get correlation (default 0 if not available)
                corr = 1.0 if si == sj else corr_matrix.get(si, {}).get(sj, 0.0)

                variance += wi * wj * vi * vj * corr

        return np.sqrt(max(variance, 0))

    def _risk_contributions(
        self,
        symbols: List[str],
        weights: Dict[str, float],
        vols: Dict[str, float],
        corr_matrix: Dict[str, Dict[str, float]],
        port_vol: float
    ) -> Dict[str, float]:
        """
        Marginal risk contribution of each asset.
        RC_i = w_i * (Σ * w)_i / portfolio_vol
        """
        if port_vol <= 0:
            return {s: 0.0 for s in symbols}

        n = len(symbols)
        contributions = {}

        for i in range(n):
            si = symbols[i]
            marginal = 0.0

            for j in range(n):
                sj = symbols[j]
                corr = 1.0 if si == sj else corr_matrix.get(si, {}).get(sj, 0.0)
                marginal += weights[sj] * vols[si] * vols[sj] * corr

            rc = (weights[si] * marginal) / port_vol
            contributions[si] = round(rc * 100, 2)  # As percentage

        # Normalize to sum to 100 and clamp tiny negatives
        total_rc = sum(contributions.values())
        if total_rc > 0:
            for s in contributions:
                contributions[s] = round((contributions[s] / total_rc) * 100, 2)
                # Clamp floating-point artifacts like -0.0
                if contributions[s] <= 0:
                    contributions[s] = 0.0

        return contributions

    def _high_correlation_pairs(
        self,
        corr_matrix: Dict[str, Dict[str, float]]
    ) -> List[List]:
        """Find all asset pairs with correlation above threshold."""
        pairs = []
        seen = set()

        for s1 in corr_matrix:
            for s2 in corr_matrix[s1]:
                if s1 == s2:
                    continue
                pair_key = tuple(sorted([s1, s2]))
                if pair_key in seen:
                    continue
                seen.add(pair_key)

                corr = corr_matrix[s1][s2]
                if abs(corr) >= self.HIGH_CORR_THRESHOLD:
                    pairs.append([s1, s2, round(corr, 4)])

        return sorted(pairs, key=lambda x: abs(x[2]), reverse=True)


# ------------------------------------------------------------------
# Quick test
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("RiskLens Phase 2 — Portfolio Intelligence Test\n")

    from data_collector import MarketDataCollector
    from feature_engine import FeatureEngine
    from risk_metrics import RiskMetrics

    portfolio = {
        "assets": [
            {"symbol": "AAPL", "type": "stock", "value": 20000},
            {"symbol": "BTC", "type": "crypto", "value": 15000},
            {"symbol": "Gold", "type": "commodity", "value": 5000},
            {"symbol": "US Bonds", "type": "bond", "value": 10000},
        ]
    }

    collector = MarketDataCollector(lookback_days=90)
    data = collector.fetch_from_portfolio(portfolio)

    engine = FeatureEngine()
    features = engine.engineer(data)

    metrics = RiskMetrics()
    risk_result = metrics.calculate(features)

    intel = PortfolioIntelligence()
    result = intel.analyze(risk_result, portfolio)

    print(f"  Portfolio Volatility:   {result['portfolio_volatility_pct']}%")
    print(f"  Diversification Ratio:  {result['diversification_ratio']}")
    print(f"\n  Risk Contributions:")
    for sym, pct in result["risk_contributions"].items():
        print(f"    {sym}: {pct}%")
    if result["high_correlation_pairs"]:
        print(f"\n  High Correlation Pairs:")
        for pair in result["high_correlation_pairs"]:
            print(f"    {pair[0]} ↔ {pair[1]}: {pair[2]}")
    else:
        print(f"\n  No high-correlation pairs detected.")
