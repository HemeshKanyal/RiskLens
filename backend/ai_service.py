import sys
import os

# allow backend to access ai_phase1 and ai_phase2
sys.path.append(os.path.abspath("../"))

from ai_phase2.ai_engine_v2 import PortfolioAIv2


def run_ai_analysis(portfolio_data, risk_profile="balanced", lookback_days=90):
    """
    Run the upgraded Phase 2 AI analysis.
    Combines rule-based logic with historical market performance.
    """
    ai = PortfolioAIv2(
        portfolio_data, 
        risk_profile=risk_profile, 
        lookback_days=lookback_days
    )

    result = ai.analyze()

    return result