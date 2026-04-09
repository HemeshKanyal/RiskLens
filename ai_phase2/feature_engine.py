"""
RiskLens Phase 2 — Step 2: Feature Engineering
Converts raw price data into financial signals: returns, volatility, cumulative returns.
"""

import numpy as np
import pandas as pd
from typing import Dict


class FeatureEngine:
    """
    Transforms raw closing prices into useful financial features.
    """

    ANNUALIZATION_FACTOR = np.sqrt(252)  # Trading days in a year
    ROLLING_WINDOW = 21  # ~1 month of trading days

    def __init__(self, rolling_window: int = 21):
        self.rolling_window = rolling_window

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def engineer(self, market_data: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """
        Process all assets in the market data dict.

        Args:
            market_data: { symbol: DataFrame(date, close) }

        Returns:
            { symbol: DataFrame(date, close, daily_return, rolling_vol, cumulative_return) }
        """
        results: Dict[str, pd.DataFrame] = {}

        for symbol, df in market_data.items():
            try:
                engineered = self._engineer_single(df.copy())
                if engineered is not None:
                    results[symbol] = engineered
            except Exception as e:
                print(f"[WARN] Feature engineering failed for {symbol}: {e}")

        return results

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _engineer_single(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add computed features to a single asset's DataFrame."""

        if len(df) < 2:
            print("[WARN] Not enough data points for feature engineering.")
            return None

        # Daily returns: (today - yesterday) / yesterday
        df["daily_return"] = df["close"].pct_change()

        # Rolling volatility: annualized std of returns over window
        df["rolling_vol"] = (
            df["daily_return"]
            .rolling(window=self.rolling_window)
            .std()
            * self.ANNUALIZATION_FACTOR
        )

        # Cumulative return from start
        df["cumulative_return"] = (1 + df["daily_return"]).cumprod() - 1

        # Drop the first row (NaN from pct_change)
        df = df.dropna(subset=["daily_return"]).reset_index(drop=True)

        return df


# ------------------------------------------------------------------
# Quick test
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("RiskLens Phase 2 — Feature Engine Test\n")

    from data_collector import MarketDataCollector

    collector = MarketDataCollector(lookback_days=90)
    data = collector.fetch(["AAPL", "BTC"])

    engine = FeatureEngine()
    features = engine.engineer(data)

    for symbol, df in features.items():
        print(f"\n--- {symbol} ---")
        print(f"  Data points: {len(df)}")
        print(f"  Latest daily return: {df['daily_return'].iloc[-1]:.4%}")
        if not pd.isna(df['rolling_vol'].iloc[-1]):
            print(f"  Latest rolling vol:  {df['rolling_vol'].iloc[-1]:.4%}")
        print(f"  Total return:        {df['cumulative_return'].iloc[-1]:.4%}")
