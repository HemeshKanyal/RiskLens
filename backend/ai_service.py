import sys
import os

# allow backend to access ai_phase1 and ai_phase2
sys.path.append(os.path.abspath("../"))

from ai_phase2.ai_engine_v2 import PortfolioAIv2
from ai_phase3.behavioral_engine import BehavioralEngine


def run_ai_analysis(portfolio_data, risk_profile="balanced", lookback_days=90, 
                    user_history=None, decision_logs=None):
    """
    Run the upgraded AI analysis (Phase 2 + Phase 3).
    Combines rule-based logic, market performance, AND behavioral history.

    Args:
        portfolio_data: dict with "assets" list
        risk_profile: "conservative", "balanced", or "aggressive"
        lookback_days: Days of market data to analyze
        user_history: List of user_interactions docs from MongoDB
        decision_logs: List of decision_logs docs for cross-referencing asset classes
    
    Returns:
        dict with AI analysis result + behavioral personalization + LLM context
    """
    # Phase 2 — Market & Rule Intelligence
    ai_v2 = PortfolioAIv2(
        portfolio_data, 
        risk_profile=risk_profile, 
        lookback_days=lookback_days
    )
    result = ai_v2.analyze()

    # Phase 3 — Behavioral Intelligence (Learning from User Actions)
    behavioral_engine = BehavioralEngine(
        historical_interactions=user_history or [],
        decision_logs=decision_logs or []
    )
    personalization = behavioral_engine.calculate_personalization_offset(risk_profile)

    # Generate LLM context for personalized explanations
    llm_context = behavioral_engine.generate_llm_context(risk_profile)

    # Attach Phase 3 as context only. The risk score is a property of the
    # portfolio and must not move based on how the user has responded to
    # past suggestions; behavior only informs recommendations/explanations.
    if personalization["confidence"] > 0:
        result["personalization"] = personalization

    # Attach LLM context to the result so app.py can pass it to generate_llm_explanation
    result["_behavioral_llm_context"] = llm_context

    return result