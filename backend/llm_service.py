import requests
import logging
import json

logger = logging.getLogger("risklens.llm")


def _trim_analysis(ai_result):
    """Extract only the key fields the LLM needs — avoids sending massive dicts."""
    try:
        summary = ai_result.get("summary", {})
        risk = ai_result.get("risk", {})
        rebalancing = ai_result.get("rebalancing", {})
        phase2 = ai_result.get("phase2", {})

        trimmed = {
            "risk_score": risk.get("risk_score"),
            "risk_level": risk.get("risk_level"),
            "phase1_score": risk.get("phase1_score"),
            "phase2_score": risk.get("phase2_score"),
            "explanation": risk.get("explanation"),
            "summary": summary,
            "rebalancing": rebalancing,
        }

        # Add Phase 2 insights if available
        if phase2:
            insights = phase2.get("insights", {})
            trimmed["portfolio_summary"] = insights.get("summary", "")
            trimmed["portfolio_volatility"] = phase2.get("portfolio_intelligence", {}).get("portfolio_volatility_pct")
            trimmed["diversification_ratio"] = phase2.get("portfolio_intelligence", {}).get("diversification_ratio")
            # Only include message text from insights, not full objects
            portfolio_insights = insights.get("portfolio_insights", [])
            trimmed["key_insights"] = [
                i.get("message", str(i)) if isinstance(i, dict) else str(i)
                for i in portfolio_insights[:5]
            ]

        return json.dumps(trimmed, indent=2, default=str)
    except Exception:
        return json.dumps(ai_result, indent=2, default=str)[:3000]


def generate_llm_explanation(ai_result, behavioral_context=None):
    """
    Generate a natural-language explanation of portfolio analysis using Llama 3.1 via Ollama.
    
    Args:
        ai_result: The AI analysis result dict from the pipeline.
        behavioral_context: Optional string from BehavioralEngine.generate_llm_context()
                            containing user behavioral data for personalized explanations.
    """

    # Build the behavioral section only if context is available
    behavioral_section = ""
    if behavioral_context:
        behavioral_section = f"""
## User Behavioral Profile (Phase 3 — Personalization Data)
{behavioral_context}

"""

    analysis_text = _trim_analysis(ai_result)

    prompt = f"""You are a senior financial risk analyst at RiskLens.

{behavioral_section}Explain the following portfolio analysis in simple but professional language.
Focus specifically on:
1. The combined risk score and what it means for the selected risk profile.
2. Market-driven insights from Phase 2 (Volatility and Correlations).
3. Personalized behavioral insights from Phase 3 (based on 'personalization' data if present).
4. Which assets are the biggest risk contributors.
5. Actionable rebalancing recommendations.

If behavioral data is provided above, personalize your tone and recommendations
to align with the user's actual decision-making style, not just their stated profile.
For example, if the user tends to reject bond recommendations, don't push bonds heavily —
suggest alternatives that match their demonstrated preferences.

Keep your response concise (under 300 words).

Analysis Data:
{analysis_text}

Provide clear, explainable insights that help the investor make wise decisions.
"""

    try:
        logger.info("Requesting LLM explanation from Ollama...")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 512,  # Limit output tokens for speed
                    "temperature": 0.7,
                }
            },
            timeout=300
        )

        result = response.json()
        logger.info("LLM explanation generated successfully")
        return result["response"]

    except Exception as e:
        logger.warning("LLM generation failed: %s", str(e))
        return "AI explanation is temporarily unavailable. Your portfolio analysis and risk scores above are fully computed — only the natural language summary could not be generated."