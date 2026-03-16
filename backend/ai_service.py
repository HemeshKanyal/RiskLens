import sys
import os

# allow backend to access ai_phase1
sys.path.append(os.path.abspath("../"))

from ai_phase1.ai_engine import PortfolioAI


def run_ai_analysis(portfolio_data, risk_profile="balanced"):

    ai = PortfolioAI(portfolio_data, risk_profile=risk_profile)

    result = ai.analyze()

    return result