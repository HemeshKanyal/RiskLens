import requests
import logging

logger = logging.getLogger("risklens.llm")


def generate_llm_explanation(ai_result):

    prompt = f"""
You are a financial portfolio risk analyst.

Explain the following portfolio analysis in simple language.

Analysis:
{ai_result}

Give clear insights and suggestions.
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