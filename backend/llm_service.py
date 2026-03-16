import google.generativeai as genai
import os
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

def generate_llm_explanation(ai_result):

    prompt = f"""
You are a financial portfolio risk analyst.

Explain the following portfolio analysis in simple language.

Analysis:
{ai_result}

Give clear insights and suggestions.
"""

    try:
        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        return f"LLM generation failed: {str(e)}"