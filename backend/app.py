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

    # Step 4 — claim hash
    claim_string = json.dumps(ai_result)
    claim_hash = hashlib.sha256(claim_string.encode()).hexdigest()

    # Step 5 — ZK proof
    proof, public_inputs = generate_zk_proof(snapshot_hash, claim_hash)

    # Step 6 — blockchain attestation
    tx_hash = submit_attestation(proof, public_inputs)

    return {
        "ai_analysis": ai_result,
        "llm_explanation": explanation,
        "snapshot_hash": snapshot_hash,
        "claim_hash": claim_hash,
        "zk_proof": proof,
        "public_inputs": public_inputs,
        "blockchain_tx": tx_hash
    }