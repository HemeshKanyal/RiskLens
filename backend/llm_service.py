import requests
import logging

logger = logging.getLogger("risklens.llm")


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

    prompt = f"""
You are a senior financial risk analyst at RiskLens.

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

Analysis Data:
{ai_result}

Provide clear, explainable insights that help the investor make wise decisions.
"""

    try:
        logger.info("Requesting LLM explanation from Ollama...")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        result = response.json()
        logger.info("LLM explanation generated successfully")
        return result["response"]

    except Exception as e:
        logger.warning("LLM generation failed: %s", str(e))
        return f"LLM generation failed: {str(e)}"