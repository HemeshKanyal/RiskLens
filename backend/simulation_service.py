"""
RiskLens Simulation Service
Allows users to test 'What-if' scenarios without persisting data.
"""

from ai_service import run_ai_analysis
from pricing_service import get_asset_price
import logging

logger = logging.getLogger("risklens.simulation")

def run_simulation(portfolio_data, risk_profile="balanced", lookback_days=90, user_history=None):
    """
    Simulate a portfolio state.
    Resolves prices if missing, then runs the full AI pipeline.
    """
    logger.info("Starting simulation...")
    
    # Resolve prices for simulation assets if quantity provided but value is not
    for asset in portfolio_data.get("assets", []):
        if asset.get("value") is None and asset.get("quantity") is not None:
            live_price = get_asset_price(asset["symbol"], asset["type"])
            if live_price:
                asset["value"] = round(live_price * asset["quantity"], 2)
                logger.info("Simulated price resolved for %s: $%.2f", asset["symbol"], asset["value"])

    # Run AI Analysis (Phase 2 + Phase 3)
    result = run_ai_analysis(
        portfolio_data, 
        risk_profile=risk_profile, 
        lookback_days=lookback_days,
        user_history=user_history
    )
    
    return result
