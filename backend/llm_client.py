"""
One interface to the language model, so the backend can use a local Ollama
model in development and Google Gemini in production.

    LLM_PROVIDER=ollama   OLLAMA_URL, OLLAMA_MODEL, OLLAMA_VISION_MODEL
    LLM_PROVIDER=gemini   GEMINI_API_KEY, GEMINI_MODEL

Only portfolio figures and screenshots go to the model; identity details
never reach the backend at all.
"""
import os
import logging
from functools import lru_cache

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("risklens.llm_client")

PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
OLLAMA_BASE = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "moondream")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-flash-lite-latest")
GEMINI_MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "4096"))


class LLMUnavailable(Exception):
    pass


@lru_cache(maxsize=1)
def _gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMUnavailable("GEMINI_API_KEY is not set.")
    from google import genai  # imported lazily: only needed for this provider
    return genai.Client(api_key=api_key)


def _gemini_generate(contents, temperature: float) -> str:
    """
    Gemini "thinking" models spend output tokens on reasoning before the
    answer, so the limit stays generous; prompts ask for short answers. If the
    main model is overloaded or rate-limited, retry once on the fallback.
    """
    from google.genai import errors, types
    config = types.GenerateContentConfig(temperature=temperature, max_output_tokens=GEMINI_MAX_TOKENS)
    models = [GEMINI_MODEL] + ([GEMINI_FALLBACK_MODEL] if GEMINI_FALLBACK_MODEL else [])
    for i, model in enumerate(models):
        try:
            response = _gemini().models.generate_content(model=model, contents=contents, config=config)
        except errors.APIError as e:
            if e.code in (429, 503) and i + 1 < len(models):
                logger.warning("Gemini %s unavailable (%s); trying %s", model, e.code, models[i + 1])
                continue
            raise LLMUnavailable(f"Gemini error {e.code}: {e.message}") from e
        if response.text:
            return response.text
        logger.warning("Gemini %s returned no text (%s)", model, response.candidates[0].finish_reason if response.candidates else "no candidates")
    raise LLMUnavailable("Gemini returned no text.")


def _ollama_generate(model: str, prompt: str, temperature: float, max_tokens: int, images=None) -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens},
    }
    if images:
        payload["images"] = images
    response = requests.post(f"{OLLAMA_BASE}/api/generate", json=payload, timeout=300)
    if response.status_code != 200:
        raise LLMUnavailable(f"Ollama returned {response.status_code}: {response.text[:200]}")
    return response.json()["response"]


def generate_text(prompt: str, temperature: float = 0.3, max_tokens: int = 1024) -> str:
    if PROVIDER == "gemini":
        return _gemini_generate(prompt, temperature)
    return _ollama_generate(OLLAMA_MODEL, prompt, temperature, max_tokens)


def generate_from_image(prompt: str, image_jpeg: bytes, temperature: float = 0.1, max_tokens: int = 1024) -> str:
    if PROVIDER == "gemini":
        from google.genai import types
        return _gemini_generate([types.Part.from_bytes(data=image_jpeg, mime_type="image/jpeg"), prompt], temperature)
    import base64
    return _ollama_generate(
        OLLAMA_VISION_MODEL, prompt, temperature, max_tokens, images=[base64.b64encode(image_jpeg).decode()]
    )
