import requests

def generate_llm_explanation(ai_result):

    prompt = f"""
You are a financial portfolio risk analyst.

Explain the following portfolio analysis in simple language.

Analysis:
{ai_result}

Give clear insights and suggestions.
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False
            }
        )

        result = response.json()
        return result["response"]

    except Exception as e:
        return f"LLM generation failed: {str(e)}"