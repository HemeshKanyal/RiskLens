"""
RiskLens Backtest Service
Connects the Backend to the AI Backtest Engine.
"""

import sys
import os
import logging

# allow backend to access ai_phase2
sys.path.append(os.path.abspath("../"))

from ai_phase2.backtest_engine import BacktestEngine

logger = logging.getLogger("risklens.backtest.service")

def run_historical_backtest(portfolio_data, event_id: str):
    """
    Run a stress test on the portfolio for a specific historical event.
    """
    logger.info("Initializing historical backtest for event: %s", event_id)
    
    engine = BacktestEngine()
    try:
        result = engine.run_event_backtest(portfolio_data, event_id)
        return result
    except Exception as e:
        logger.error("Backtest failed: %s", str(e))
        raise e
