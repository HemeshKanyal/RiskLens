"""
RiskLens Phase 2 — Step 1: Market Data Collector
Fetches historical price data for portfolio assets using yfinance.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import yfinance as yf
import pandas as pd


class MarketDataCollector:
    """
    Fetches and caches historical market data for portfolio assets.
    Supports stocks, crypto, ETFs, commodities via Yahoo Finance.
    """

    # Map common asset symbols to Yahoo Finance tickers
    SYMBOL_MAP = {
        "BTC": "BTC-USD",
        "ETH": "ETH-USD",
        "SOL": "SOL-USD",
        "DOGE": "DOGE-USD",
        "ADA": "ADA-USD",
        "XRP": "XRP-USD",
        "DOT": "DOT-USD",
        "AVAX": "AVAX-USD",
        "MATIC": "MATIC-USD",
        "LINK": "LINK-USD",
        "Gold": "GLD",
        "Silver": "SLV",
        "Oil": "USO",
        "US Bonds": "TLT",
    }

    def __init__(self, cache_dir: Optional[str] = None, lookback_days: int = 90):
        """
        Args:
            cache_dir:     Directory to store cached data. Defaults to ai_phase2/.cache
            lookback_days: Number of historical days to fetch (default 90).
        """
        self.lookback_days = lookback_days

        if cache_dir is None:
            base = os.path.dirname(os.path.abspath(__file__))
            cache_dir = os.path.join(base, ".cache")

        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch(self, symbols: List[str], start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, pd.DataFrame]:
        """
        Fetch historical closing prices for a list of symbols.
        Optional start_date and end_date allow for historical stress-testing.
        """
        results: Dict[str, pd.DataFrame] = {}

        for symbol in symbols:
            try:
                df = self._fetch_single(symbol, start_date, end_date)
                if df is not None and not df.empty:
                    results[symbol] = df
                else:
                    print(f"[WARN] No data returned for {symbol}. Skipping.")
            except Exception as e:
                print(f"[WARN] Failed to fetch {symbol}: {e}. Skipping.")

        return results

    def fetch_from_portfolio(self, portfolio_data: Dict, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, pd.DataFrame]:
        """
        Convenience: extract symbols from a portfolio dict and fetch data.
        """
        assets = portfolio_data.get("assets", [])
        symbols = [asset["symbol"] for asset in assets]
        return self.fetch(symbols, start_date, end_date)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _resolve_ticker(self, symbol: str) -> str:
        """Map user-facing symbol to Yahoo Finance ticker."""
        return self.SYMBOL_MAP.get(symbol, symbol)

    def _cache_key(self, symbol: str, start_date: Optional[datetime], end_date: Optional[datetime]) -> str:
        """Generate a cache filename based on symbol + range."""
        if start_date and end_date:
            date_range = f"{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}"
        else:
            date_range = f"lookback_{self.lookback_days}_{datetime.now().strftime('%Y%m%d')}"
            
        raw = f"{symbol}_{date_range}"
        hashed = hashlib.md5(raw.encode()).hexdigest()[:12]
        return os.path.join(self.cache_dir, f"{symbol}_{hashed}.csv")

    def _fetch_single(self, symbol: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Optional[pd.DataFrame]:
        """Fetch data for one symbol, using cache if available."""

        cache_path = self._cache_key(symbol, start_date, end_date)

        # Check cache
        if os.path.exists(cache_path):
            df = pd.read_csv(cache_path, parse_dates=["date"])
            return df

        # Fetch from Yahoo Finance
        ticker = self._resolve_ticker(symbol)
        
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=self.lookback_days)

        yf_ticker = yf.Ticker(ticker)
        hist = yf_ticker.history(start=start_date.strftime("%Y-%m-%d"),
                                 end=end_date.strftime("%Y-%m-%d"))

        if hist.empty:
            return None

        # Clean and normalize
        df = hist[["Close"]].reset_index()
        df.columns = ["date", "close"]
        df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
        df = df.sort_values("date").reset_index(drop=True)

        # Save to cache
        df.to_csv(cache_path, index=False)

        return df



# ------------------------------------------------------------------
# Quick test
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("RiskLens Phase 2 — Data Collector Test\n")

    collector = MarketDataCollector(lookback_days=90)

    test_symbols = ["AAPL", "BTC", "Gold", "US Bonds"]
    data = collector.fetch(test_symbols)

    for symbol, df in data.items():
        print(f"{symbol}: {len(df)} days | "
              f"Range: {df['date'].iloc[0].date()} → {df['date'].iloc[-1].date()} | "
              f"Latest close: ${df['close'].iloc[-1]:.2f}")
