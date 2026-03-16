from fastapi import FastAPI
from models import PortfolioRequest
from ai_service import run_ai_analysis
from llm_service import generate_llm_explanation
from zk_service import generate_zk_proof
from blockchain_service import submit_attestation
import hashlib
import json

app = FastAPI(title="RiskLens Backend")


@app.get("/")
def home():
    return {"message": "RiskLens backend running"}


@app.post("/analyze")
def analyze_portfolio(request: PortfolioRequest):

    portfolio_dict = {
        "assets": [asset.dict() for asset in request.assets]
    }

    # Step 1 — AI analysis
    ai_result = run_ai_analysis(portfolio_dict, request.risk_profile)

    # Step 2 — LLM explanation
    explanation = generate_llm_explanation(ai_result)

    # Step 3 — snapshot hash
    snapshot_string = json.dumps(portfolio_dict)

    snapshot_hash = hashlib.sha256(snapshot_string.encode()).hexdigest()

    # Step 4 — ZK proof (placeholder)
    proof = generate_zk_proof(snapshot_hash)
    
    if proof is None:
        raise Exception("ZK proof generation failed")

    # Step 5 — blockchain attestation (placeholder)
    tx_hash = submit_attestation(snapshot_hash, proof)

    return {
        "ai_analysis": ai_result,
        "llm_explanation": explanation,
        "snapshot_hash": snapshot_hash,
        "zk_proof": proof,
        "blockchain_tx": tx_hash
    }

@app.post("/portfolio-chat")
def portfolio_chat(request: PortfolioRequest):

    ai_result = run_ai_analysis(
        {"assets":[a.dict() for a in request.assets]},
        request.risk_profile
    )

    explanation = generate_llm_explanation(ai_result)

    return {
        "insight": explanation
    }