import requests
import logging

logger = logging.getLogger("risklens.llm")


def generate_llm_explanation(ai_result):

    prompt = f"""
You are a senior financial risk analyst at RiskLens.

Explain the following portfolio analysis in simple but professional language.
Focus specifically on:
1. The combined risk score and what it means for the selected risk profile.
2. Market-driven insights from Phase 2 (Volatility and Correlations).
3. Which assets are the biggest risk contributors.
4. Actionable rebalancing recommendations.

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