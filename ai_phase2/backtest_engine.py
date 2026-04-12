"""
RiskLens Phase 2 — Stress Testing / Backtest Engine
Allows users to see how their portfolio would have performed during historical crises.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

from ai_phase2.data_collector import MarketDataCollector
from ai_phase2.feature_engine import FeatureEngine
from ai_phase2.risk_metrics import RiskMetrics
from ai_phase2.portfolio_intelligence import PortfolioIntelligence

logger = logging.getLogger("risklens.ai.backtest")

# PRE-DEFINED HISTORICAL STRESS EVENTS
STRESS_EVENTS = {
    "COVID_2020": {
        "name": "COVID-19 Market Crash",
        "start": "2020-02-15",
        "end": "2020-05-01",
        "context": "Rapid global sell-off as pandemic lockdowns began. High correlation across all risky assets."
    },
    "CRYPTO_WINTER_2022": {
        "name": "2022 Inflation & Crypto Winter",
        "start": "2022-01-01",
        "end": "2022-12-31",
        "context": "Rising interest rates and the Terra/FTX collapses led to a prolonged bear market for tech and crypto."
    },
    "BANKING_CRISIS_2008": {
        "name": "2008 Global Financial Crisis",
        "start": "2008-09-01",
        "end": "2009-03-31",
        "context": "The Lehman Brothers collapse and subsequent housing market meltdown. Massive volatility in banking and stocks."
    }
}

class BacktestEngine:
    """
    Simulates portfolio performance during historical market windows.
    """

    def __init__(self):
        self.feature_engine = FeatureEngine()
        self.risk_calc = RiskMetrics()
        self.intel = PortfolioIntelligence()

    def run_event_backtest(self, portfolio: Dict, event_id: str) -> Dict[str, Any]:
        """
        Run a backtest for a specific historical event.
        """
        event = STRESS_EVENTS.get(event_id)
        if not event:
            raise ValueError(f"Unknown stress event: {event_id}")

        logger.info(f"Running backtest for event: {event['name']} ({event['start']} to {event['end']})")

        start_dt = datetime.strptime(event["start"], "%Y-%m-%d")
        end_dt = datetime.strptime(event["end"], "%Y-%m-%d")

        # 1. Fetch historical data for the event window
        collector = MarketDataCollector()
        market_data = collector.fetch_from_portfolio(portfolio, start_date=start_dt, end_date=end_dt)

        if not market_data:
            return {
                "event_name": event["name"],
                "error": "Insufficient historical data for all assets during this period.",
                "context": event["context"]
            }

        # 2. Engineer features
        features = self.feature_engine.engineer(market_data)

        # 3. Calculate metrics for that period
        risk_result = self.risk_calc.calculate(features)

        # 4. Intelligence (Diversification, Risk Contributions during the crisis)
        portfolio_intel = self.intel.analyze(risk_result, portfolio)

        # 5. Summarize the 'Impact'
        # Which asset was the worst performer?
        per_asset = risk_result["per_asset"]
        worst_asset = None
        max_dd = 0
        
        for sym, m in per_asset.items():
            if m["max_drawdown_pct"] < max_dd:
                max_dd = m["max_drawdown_pct"]
                worst_asset = sym

        return {
            "event_id": event_id,
            "event_name": event["name"],
            "period": f"{event['start']} to {event['end']}",
            "context": event["context"],
            "portfolio_metrics": {
                "max_drawdown_pct": portfolio_intel["portfolio_volatility_pct"], # Proxy for crisis volatility
                "diversification_ratio": portfolio_intel["diversification_ratio"]
            },
            "worst_performing_asset": worst_asset,
            "worst_asset_drawdown": max_dd,
            "per_asset_metrics": per_asset,
            "data_coverage": f"{len(market_data)} / {len(portfolio['assets'])} assets tracked"
        }
