"""
RiskLens Phase 2 — Step 3: Risk Metrics
Calculates volatility, max drawdown, Sharpe ratio, and correlation matrix.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any


class RiskMetrics:
    """
    Computes core risk metrics from engineered feature data.
    """

    RISK_FREE_RATE = 0.04  # Annual risk-free rate (4%)
    ANNUALIZATION_FACTOR = np.sqrt(252)
    TRADING_DAYS_YEAR = 252

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate(self, features: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """
        Calculate all risk metrics for the portfolio.

        Args:
            features: { symbol: DataFrame with daily_return, rolling_vol, cumulative_return }

        Returns:
            {
                "per_asset": { symbol: { volatility, vol_classification, max_drawdown, sharpe_ratio } },
                "correlation_matrix": { sym1: { sym2: corr_value, ... }, ... }
            }
        """
        per_asset = {}
        for symbol, df in features.items():
            try:
                per_asset[symbol] = self._compute_asset_metrics(df)
            except Exception as e:
                print(f"[WARN] Risk metrics failed for {symbol}: {e}")

        correlation = self._compute_correlation(features)

        return {
            "per_asset": per_asset,
            "correlation_matrix": correlation
        }

    # ------------------------------------------------------------------
    # Per-asset metrics
    # ------------------------------------------------------------------

    def _compute_asset_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Compute volatility, max drawdown, and Sharpe ratio for one asset."""

        returns = df["daily_return"].dropna()

        # --- Annualized Volatility ---
        volatility = returns.std() * self.ANNUALIZATION_FACTOR
        volatility_pct = round(volatility * 100, 2)

        if volatility_pct < 15:
            vol_class = "Low"
        elif volatility_pct < 30:
            vol_class = "Moderate"
        else:
            vol_class = "High"

        # --- Maximum Drawdown ---
        cumulative = (1 + returns).cumprod()
        peak = cumulative.cummax()
        drawdown = (cumulative - peak) / peak
        max_drawdown = round(drawdown.min() * 100, 2)  # Negative value

        # --- Sharpe Ratio (simplified) ---
        mean_daily_return = returns.mean()
        annual_return = mean_daily_return * self.TRADING_DAYS_YEAR
        sharpe = round((annual_return - self.RISK_FREE_RATE) / (volatility if volatility > 0 else 1), 2)

        return {
            "volatility_pct": volatility_pct,
            "vol_classification": vol_class,
            "max_drawdown_pct": max_drawdown,
            "sharpe_ratio": sharpe
        }

    # ------------------------------------------------------------------
    # Correlation matrix
    # ------------------------------------------------------------------

    def _compute_correlation(self, features: Dict[str, pd.DataFrame]) -> Dict[str, Dict[str, float]]:
        """
        Compute pairwise correlation of daily returns across all assets.
        Returns a JSON-serializable nested dict.
        """
        if len(features) < 2:
            return {}

        # Build a combined DataFrame of daily returns
        returns_dict = {}
        for symbol, df in features.items():
            series = df.set_index("date")["daily_return"].dropna()
            returns_dict[symbol] = series

        combined = pd.DataFrame(returns_dict)

        # Only correlate where we have overlapping dates
        corr_matrix = combined.corr()

        # Convert to nested dict with rounded values
        result = {}
        for sym1 in corr_matrix.index:
            result[sym1] = {}
            for sym2 in corr_matrix.columns:
                result[sym1][sym2] = round(corr_matrix.loc[sym1, sym2], 4)

        return result


# ------------------------------------------------------------------
# Quick test
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("RiskLens Phase 2 — Risk Metrics Test\n")

    from data_collector import MarketDataCollector
    from feature_engine import FeatureEngine

    collector = MarketDataCollector(lookback_days=90)
    data = collector.fetch(["AAPL", "BTC", "Gold", "US Bonds"])

    engine = FeatureEngine()
    features = engine.engineer(data)

    metrics = RiskMetrics()
    result = metrics.calculate(features)

    print("=== Per-Asset Metrics ===")
    for symbol, m in result["per_asset"].items():
        print(f"\n  {symbol}:")
        print(f"    Volatility:    {m['volatility_pct']}% ({m['vol_classification']})")
        print(f"    Max Drawdown:  {m['max_drawdown_pct']}%")
        print(f"    Sharpe Ratio:  {m['sharpe_ratio']}")

    if result["correlation_matrix"]:
        print("\n=== Correlation Matrix ===")
        symbols = list(result["correlation_matrix"].keys())
        header = "         " + "  ".join(f"{s:>8}" for s in symbols)
        print(header)
        for s1 in symbols:
            row = f"  {s1:>6} " + "  ".join(
                f"{result['correlation_matrix'][s1][s2]:>8.4f}" for s2 in symbols
            )
            print(row)
