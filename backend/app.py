from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from models import PortfolioRequest, KYCRequest, UserCreate, UserLogin, GoogleLogin, UserResponse, UserInDB, Token
import auth
import database
from ai_service import run_ai_analysis
from llm_service import generate_llm_explanation
from zk_service import generate_zk_proof
from zk_kyc_service import generate_kyc_proof
from blockchain_service import submit_attestation
from blockchain_kyc_service import submit_kyc_verification
from pricing_service import get_asset_price, get_bulk_prices

import hashlib
import json
from datetime import datetime

app = FastAPI(title="RiskLens Backend")

@app.on_event("startup")
async def startup_db_client():
    await database.connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await database.close_mongo_connection()

# --- Auth Endpoints ---

@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    users_collection = database.get_users_collection()
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.dict()
    user_dict["hashed_password"] = auth.get_password_hash(user_dict.pop("password"))
    
    await users_collection.insert_one(user_dict)
    return user_dict

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users_collection = database.get_users_collection()
    user_data = await users_collection.find_one({"email": form_data.username})
    
    if not user_data or not auth.verify_password(form_data.password, user_data.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = auth.create_access_token(data={"sub": user_data["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=Token)
async def google_auth(login_data: GoogleLogin):
    idinfo = auth.verify_google_token(login_data.google_id_token)
    email = idinfo.get("email")
    name = idinfo.get("name")
    
    users_collection = database.get_users_collection()
    user_data = await users_collection.find_one({"email": email})
    
    if not user_data:
        # Register new user
        new_user = {
            "email": email,
            "full_name": name,
            "google_id": idinfo.get("sub"),
            "is_active": True
        }
        await users_collection.insert_one(new_user)
        
    access_token = auth.create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(auth.get_current_user)):
    return current_user


@app.get("/")
def home():
    return {"message": "RiskLens backend running"}


@app.post("/analyze")
async def analyze_portfolio(request: PortfolioRequest, current_user: UserResponse = Depends(auth.get_current_user)):

    # Step 0 — Resolve live prices for assets missing a value
    resolved_assets = []
    live_prices_used = {}

    for asset in request.assets:
        asset_data = asset.dict()

        if asset_data.get("value") is None:
            # No value provided — fetch live price
            if asset_data.get("quantity") is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Asset '{asset_data['symbol']}' must have either 'value' or 'quantity' specified."
                )

            live_price = get_asset_price(asset_data["symbol"], asset_data["type"])
            if live_price is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not fetch live price for '{asset_data['symbol']}'. Please provide 'value' manually."
                )

            asset_data["value"] = round(live_price * asset_data["quantity"], 2)
            live_prices_used[asset_data["symbol"]] = live_price
            print(f"💰 {asset_data['symbol']}: ${live_price} × {asset_data['quantity']} = ${asset_data['value']}")

        resolved_assets.append(asset_data)

    portfolio_dict = {"assets": resolved_assets}

    # Step 1 — AI analysis
    try:
        ai_result = run_ai_analysis(portfolio_dict, request.risk_profile)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"AI analysis failed: {str(e)}")

    # Step 2 — LLM explanation
    try:
        explanation = generate_llm_explanation(ai_result)
    except Exception:
        explanation = "LLM explanation unavailable at the moment."

    # Step 3 — snapshot hash
    snapshot_string = json.dumps(portfolio_dict)
    snapshot_hash = hashlib.sha256(snapshot_string.encode()).hexdigest()

    # Step 4 — claim hash
    claim_string = json.dumps(ai_result)
    claim_hash = hashlib.sha256(claim_string.encode()).hexdigest()

    # Step 5 — ZK proof
    try:
        proof, public_inputs = generate_zk_proof(snapshot_hash, claim_hash)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZK proof generation failed: {str(e)}")

    # Step 6 — blockchain attestation (graceful — save results even if chain fails)
    tx_hash = None
    blockchain_error = None
    try:
        tx_hash = submit_attestation(proof, public_inputs)
    except Exception as e:
        blockchain_error = str(e)
        print(f"⚠️ Blockchain attestation failed: {blockchain_error}")

    # Step 7 — Save portfolio snapshot to MongoDB (always save)
    portfolios_collection = database.get_portfolios_collection()
    portfolio_record = {
        "user_email": current_user.email,
        "assets": portfolio_dict["assets"],
        "risk_profile": request.risk_profile,
        "snapshot_hash": snapshot_hash,
        "blockchain_tx": tx_hash,
        "blockchain_status": "confirmed" if tx_hash else "failed",
        "created_at": datetime.utcnow().isoformat()
    }
    await portfolios_collection.insert_one(portfolio_record)

    # Step 8 — Save AI decision log to MongoDB (always save)
    decisions_collection = database.get_decisions_collection()
    decision_record = {
        "user_email": current_user.email,
        "action": "portfolio_analysis",
        "snapshot_hash": snapshot_hash,
        "claim_hash": claim_hash,
        "ai_analysis": ai_result,
        "llm_explanation": explanation,
        "blockchain_tx": tx_hash,
        "blockchain_status": "confirmed" if tx_hash else "failed",
        "created_at": datetime.utcnow().isoformat()
    }
    await decisions_collection.insert_one(decision_record)

    print(f"📦 Portfolio & decision saved for {current_user.email}")

    response = {
        "ai_analysis": ai_result,
        "llm_explanation": explanation,
        "snapshot_hash": snapshot_hash,
        "claim_hash": claim_hash,
        "zk_proof": proof,
        "public_inputs": public_inputs,
        "blockchain_tx": tx_hash,
        "blockchain_status": "confirmed" if tx_hash else "failed"
    }

    if live_prices_used:
        response["live_prices_used"] = live_prices_used

    if blockchain_error:
        response["blockchain_warning"] = f"Proof is valid but on-chain submission failed: {blockchain_error}"

    return response


@app.post("/verify-kyc")
async def verify_kyc(request: KYCRequest, current_user: UserResponse = Depends(auth.get_current_user)):

    # Step 1 — Generate ZK proof from user's KYC data
    try:
        proof, public_inputs, identity_hash = generate_kyc_proof(
            full_name=request.full_name,
            date_of_birth=request.date_of_birth,
            country_code=request.country_code,
            document_id=request.document_id,
            age=request.age
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KYC ZK proof generation failed: {str(e)}")

    # Step 2 — Submit proof to RiskLensZKKYC contract on-chain (graceful)
    tx_hash = None
    blockchain_error = None
    try:
        tx_hash = submit_kyc_verification(proof, public_inputs)
    except Exception as e:
        blockchain_error = str(e)
        print(f"⚠️ KYC blockchain submission failed: {blockchain_error}")

    # Step 3 — Save KYC decision log to MongoDB (always save)
    decisions_collection = database.get_decisions_collection()
    kyc_record = {
        "user_email": current_user.email,
        "action": "kyc_verification",
        "identity_commitment_hash": identity_hash,
        "blockchain_tx": tx_hash,
        "blockchain_status": "confirmed" if tx_hash else "failed",
        "created_at": datetime.utcnow().isoformat()
    }
    await decisions_collection.insert_one(kyc_record)

    # Step 4 — Mark user as KYC verified in users collection
    users_collection = database.get_users_collection()
    await users_collection.update_one(
        {"email": current_user.email},
        {"$set": {"kyc_verified": True if tx_hash else False, "kyc_tx": tx_hash}}
    )

    print(f"✅ KYC decision saved for {current_user.email}")

    response = {
        "status": "KYC verified on-chain" if tx_hash else "KYC proof valid but chain submission failed",
        "identity_commitment_hash": identity_hash,
        "zk_proof": proof,
        "public_inputs": public_inputs,
        "blockchain_tx": tx_hash,
        "blockchain_status": "confirmed" if tx_hash else "failed"
    }

    if blockchain_error:
        response["blockchain_warning"] = f"Proof is valid but on-chain submission failed: {blockchain_error}"

    return response


# --- History Endpoints ---

@app.get("/portfolio/history")
async def get_portfolio_history(current_user: UserResponse = Depends(auth.get_current_user)):
    """Fetch all saved portfolio snapshots for the logged-in user."""
    portfolios_collection = database.get_portfolios_collection()
    cursor = portfolios_collection.find(
        {"user_email": current_user.email},
        {"_id": 0}  # exclude MongoDB internal _id
    ).sort("created_at", -1)
    results = await cursor.to_list(length=100)
    return {"portfolios": results, "count": len(results)}

@app.get("/decisions")
async def get_decision_logs(current_user: UserResponse = Depends(auth.get_current_user)):
    """Fetch all AI decision logs for the logged-in user."""
    decisions_collection = database.get_decisions_collection()
    cursor = decisions_collection.find(
        {"user_email": current_user.email},
        {"_id": 0}
    ).sort("created_at", -1)
    results = await cursor.to_list(length=100)
    return {"decisions": results, "count": len(results)}


# --- Pricing Endpoints ---

@app.get("/prices")
def lookup_prices(symbols: str, types: str):
    """
    Fetch live USD prices for assets.
    
    Query params:
      - symbols: comma-separated list (e.g. "BTC,AAPL,Gold")
      - types:   comma-separated list (e.g. "crypto,stock,commodity")
    """
    symbol_list = [s.strip() for s in symbols.split(",")]
    type_list = [t.strip() for t in types.split(",")]

    if len(symbol_list) != len(type_list):
        raise HTTPException(status_code=400, detail="'symbols' and 'types' must have the same number of items.")

    items = [{"symbol": s, "type": t} for s, t in zip(symbol_list, type_list)]
    prices = get_bulk_prices(items)

    return {"prices": prices}