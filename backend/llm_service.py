import os
import re
import requests
import logging
import json

logger = logging.getLogger("risklens.llm")

OLLAMA_BASE = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")


def _trim_analysis(ai_result):
    """
    The figures the explanation may use, as explicit labelled fields.

    Small local models mix up numbers when they have to dig them out of
    prose, so per-holding values and correlated pairs are given directly.
    """
    try:
        summary = ai_result.get("summary") or {}
        risk = ai_result.get("risk") or {}
        rebalancing = ai_result.get("rebalancing") or {}
        phase2 = ai_result.get("phase2") or {}
        intel = phase2.get("portfolio_intelligence") or {}
        per_asset = phase2.get("per_asset_metrics") or {}
        contributions = intel.get("risk_contributions") or {}

        holdings = {
            symbol: {
                "share_of_value_pct": weight,
                "share_of_risk_pct": contributions.get(symbol),
                "annual_volatility_pct": (per_asset.get(symbol) or {}).get("volatility_pct"),
                "max_drawdown_pct": (per_asset.get(symbol) or {}).get("max_drawdown_pct"),
            }
            for symbol, weight in (summary.get("asset_allocations_percent") or {}).items()
        }

        trimmed = {
            "risk_score_out_of_5": risk.get("risk_score"),
            "risk_level": risk.get("risk_level"),
            "risk_profile": rebalancing.get("profile_used"),
            # Plain names so the model doesn't echo internal "Phase" jargon
            "asset_class_mix_score": risk.get("phase1_score"),
            "market_behaviour_score": risk.get("phase2_score"),
            "total_value_usd": summary.get("total_value"),
            "allocation_by_asset_class_pct": summary.get("class_allocations_percent"),
            "holdings": holdings,
            "suggested_changes": [
                re.sub(r"\s*\(Profile: \w+\)\.?$", ".", s) for s in rebalancing.get("suggestions") or []
            ],
        }

        if phase2:
            trimmed["portfolio_annual_volatility_pct"] = intel.get("portfolio_volatility_pct")
            trimmed["diversification_ratio"] = intel.get("diversification_ratio")
            pairs = intel.get("high_correlation_pairs") or []
            trimmed["highly_correlated_pairs"] = (
                [f"{a} and {b} (correlation {r})" for a, b, r in pairs] or "none"
            )
        else:
            trimmed["note"] = "Market data was unavailable; only the asset-class mix was scored."

        trimmed = {"key_facts": _key_facts(trimmed), **trimmed}
        return json.dumps(trimmed, indent=2, default=str)
    except Exception:
        return json.dumps(ai_result, indent=2, default=str)[:3000]


def _key_facts(t):
    """Comparisons and rankings stated outright, so the model only has to rephrase them."""
    facts = []
    mix, market = t.get("asset_class_mix_score"), t.get("market_behaviour_score")
    if mix is not None and market is not None:
        bigger = "the mix of asset classes" if mix >= market else "recent market behaviour (volatility)"
        facts.append(
            f"The asset-class mix scores {mix} and market behaviour scores {market} (out of 5); "
            f"{bigger} is the bigger driver of the overall score."
        )
    ranked = sorted(
        ((sym, h) for sym, h in t.get("holdings", {}).items() if h.get("share_of_risk_pct") is not None),
        key=lambda x: x[1]["share_of_risk_pct"],
        reverse=True,
    )
    if ranked:
        facts.append(
            "Holdings ordered by share of portfolio risk: "
            + ", ".join(f"{sym} {h['share_of_risk_pct']}% of risk ({h['share_of_value_pct']}% of value)" for sym, h in ranked)
            + "."
        )
        heavy = [sym for sym, h in ranked if h["share_of_risk_pct"] - h["share_of_value_pct"] >= 5]
        if heavy:
            facts.append(f"These add noticeably more risk than their size: {', '.join(heavy)}.")
    pairs = t.get("highly_correlated_pairs")
    if pairs == "none":
        facts.append("No two holdings are highly correlated.")
    elif pairs:
        facts.append("Highly correlated pairs: " + "; ".join(pairs) + ".")
    return facts


def _strip_markdown(text: str) -> str:
    """Small models sometimes ignore 'no markdown'; the UI shows plain text."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"^\s*[*-]\s+", "", text, flags=re.M)
    return text.strip()


def generate_llm_explanation(ai_result, behavioral_context=None):
    """
    Generate a natural-language explanation of portfolio analysis using a local model via Ollama.
    
    Args:
        ai_result: The AI analysis result dict from the pipeline.
        behavioral_context: Optional string from BehavioralEngine.generate_llm_context()
                            containing user behavioral data for personalized explanations.
    """

    # Build the behavioral section only if context is available
    behavioral_section = ""
    if behavioral_context:
        behavioral_section = f"""How this investor has responded to past suggestions:
{behavioral_context}

"""

    analysis_text = _trim_analysis(ai_result)

    prompt = f"""You are a financial risk analyst writing for an everyday investor.

{behavioral_section}Explain the portfolio analysis below in 3 short paragraphs of plain prose:
1. What the overall risk score (0 to 5) means for their chosen risk profile, and what drives it.
2. Which holdings contribute the most risk, and any pairs that move together.
3. The one or two most useful changes they could consider.

Rules:
- Base the explanation on "key_facts"; they are correct. Use only numbers from the data
  and never contradict a key fact.
- No markdown: no headings, bold, bullet points or numbered lists.
- Don't mention internal terms like "phase", "HHI" or field names.
- If investor history is given above, adapt suggestions to it (for example, if they keep
  declining bonds, suggest other ways to reduce risk).
- Under 200 words. This is educational information, not personal financial advice.

Analysis data:
{analysis_text}
"""

    try:
        logger.info("Requesting LLM explanation from Ollama...")
        response = requests.post(
            f"{OLLAMA_BASE}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 512,  # Limit output tokens for speed
                    "temperature": 0.3,
                }
            },
            timeout=300
        )

        result = response.json()
        logger.info("LLM explanation generated successfully")
        return _strip_markdown(result["response"])

    except Exception as e:
        logger.warning("LLM generation failed: %s", str(e))
        return "AI explanation is temporarily unavailable. Your portfolio analysis and risk scores above are fully computed — only the natural language summary could not be generated."