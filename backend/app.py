from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
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
import os
import logging
import time
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()

# ==============================
# LOGGING SETUP
# ==============================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("risklens.app")

# ==============================
# APP INIT
# ==============================

app = FastAPI(
    title="RiskLens Backend",
    description="AI-Driven Portfolio Intelligence Platform with Blockchain Proof",
    version="1.0.0"
)

# ==============================
# CORS MIDDLEWARE
# ==============================

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS enabled for origins: %s", cors_origins)

# ==============================
# RATE LIMITING (in-memory)
# ==============================

rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 5       # max requests per window for auth endpoints


def check_rate_limit(client_ip: str, endpoint: str):
    """Simple in-memory rate limiter for auth endpoints."""
    key = f"{client_ip}:{endpoint}"
    now = time.time()

    # Clean up old entries
    rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < RATE_LIMIT_WINDOW]

    if len(rate_limit_store[key]) >= RATE_LIMIT_MAX:
        logger.warning("Rate limit exceeded for %s on %s", client_ip, endpoint)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Max {RATE_LIMIT_MAX} per {RATE_LIMIT_WINDOW}s. Try again later."
        )

    rate_limit_store[key].append(now)


# ==============================
# INPUT VALIDATORS
# ==============================

VALID_ASSET_TYPES = {"stock", "crypto", "etf", "bond", "commodity"}
VALID_RISK_PROFILES = {"conservative", "balanced", "aggressive"}


def validate_portfolio_request(request: PortfolioRequest):
    """Validate portfolio input — empty assets, duplicate symbols, invalid types."""
    if not request.assets or len(request.assets) == 0:
        raise HTTPException(status_code=400, detail="Portfolio must contain at least one asset.")

    if len(request.assets) > 50:
        raise HTTPException(status_code=400, detail="Portfolio cannot exceed 50 assets.")

    seen_symbols = set()
    for asset in request.assets:
        # Check for valid asset type
        if asset.type.lower() not in VALID_ASSET_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid asset type '{asset.type}' for '{asset.symbol}'. Valid types: {', '.join(VALID_ASSET_TYPES)}"
            )

        # Check for duplicate symbols
        symbol_key = f"{asset.symbol.upper()}:{asset.type.lower()}"
        if symbol_key in seen_symbols:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate asset '{asset.symbol}' of type '{asset.type}'. Combine into one entry."
            )
        seen_symbols.add(symbol_key)

        # Check for negative values
        if asset.value is not None and asset.value < 0:
            raise HTTPException(status_code=400, detail=f"Asset '{asset.symbol}' has negative value.")

        if asset.quantity is not None and asset.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Asset '{asset.symbol}' must have positive quantity.")

        # Must have either value or quantity
        if asset.value is None and asset.quantity is None:
            raise HTTPException(
                status_code=400,
                detail=f"Asset '{asset.symbol}' must have either 'value' or 'quantity' specified."
            )

    # Validate risk profile
    if request.risk_profile.lower() not in VALID_RISK_PROFILES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid risk profile '{request.risk_profile}'. Choose from: {', '.join(VALID_RISK_PROFILES)}"
        )


def validate_kyc_request(request: KYCRequest):
    """Validate KYC input fields."""
    if not request.full_name or len(request.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")

    if request.age < 18:
        raise HTTPException(status_code=400, detail="User must be at least 18 years old.")

    if request.country_code in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Country code is in the blacklisted range.")

    if not request.document_id or len(request.document_id.strip()) < 4:
        raise HTTPException(status_code=400, detail="Document ID must be at least 4 characters.")


# ==============================
# LIFECYCLE EVENTS
# ==============================

@app.on_event("startup")
async def startup_db_client():
    await database.connect_to_mongo()
    logger.info("RiskLens backend started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    await database.close_mongo_connection()
    logger.info("RiskLens backend shut down")


# ==============================
# AUTH ENDPOINTS (rate-limited)
# ==============================

@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, request: Request):
    check_rate_limit(request.client.host, "register")

    users_collection = database.get_users_collection()
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.dict()
    user_dict["hashed_password"] = auth.get_password_hash(user_dict.pop("password"))

    await users_collection.insert_one(user_dict)
    logger.info("New user registered: %s", user.email)
    return user_dict

@app.post("/auth/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    check_rate_limit(request.client.host, "login")

    users_collection = database.get_users_collection()
    user_data = await users_collection.find_one({"email": form_data.username})

    if not user_data or not auth.verify_password(form_data.password, user_data.get("hashed_password", "")):
        logger.warning("Failed login attempt for: %s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": user_data["email"]})
    logger.info("User logged in: %s", user_data["email"])
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=Token)
async def google_auth(login_data: GoogleLogin, request: Request):
    check_rate_limit(request.client.host, "google_auth")

    idinfo = auth.verify_google_token(login_data.google_id_token)
    email = idinfo.get("email")
    name = idinfo.get("name")

    users_collection = database.get_users_collection()
    user_data = await users_collection.find_one({"email": email})

    if not user_data:
        new_user = {
            "email": email,
            "full_name": name,
            "google_id": idinfo.get("sub"),
            "is_active": True
        }
        await users_collection.insert_one(new_user)
        logger.info("New Google user registered: %s", email)

    access_token = auth.create_access_token(data={"sub": email})
    logger.info("Google user logged in: %s", email)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(auth.get_current_user)):
    return current_user


# ==============================
# HOME
# ==============================

@app.get("/")
def home():
    return {"message": "RiskLens backend running", "version": "1.0.0"}


# ==============================
# PORTFOLIO ANALYSIS (validated)
# ==============================

@app.post("/analyze")
async def analyze_portfolio(request: PortfolioRequest, current_user: UserResponse = Depends(auth.get_current_user)):

    # Input validation
    validate_portfolio_request(request)

    # Step 0 — Resolve live prices for assets missing a value
    resolved_assets = []
    live_prices_used = {}

    for asset in request.assets:
        asset_data = asset.dict()

        if asset_data.get("value") is None:
            live_price = get_asset_price(asset_data["symbol"], asset_data["type"])
            if live_price is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not fetch live price for '{asset_data['symbol']}'. Please provide 'value' manually."
                )

            asset_data["value"] = round(live_price * asset_data["quantity"], 2)
            live_prices_used[asset_data["symbol"]] = live_price
            logger.info("Live price resolved: %s = $%.2f × %.4f = $%.2f",
                        asset_data["symbol"], live_price, asset_data["quantity"], asset_data["value"])

        resolved_assets.append(asset_data)

    portfolio_dict = {"assets": resolved_assets}

    # Step 1 — AI analysis (Phase 2)
    try:
        ai_result = run_ai_analysis(portfolio_dict, request.risk_profile, request.lookback_days)
    except Exception as e:
        logger.error("AI analysis failed: %s", str(e))
        raise HTTPException(status_code=400, detail=f"AI analysis failed: {str(e)}")

    # Step 2 — LLM explanation
    try:
        explanation = generate_llm_explanation(ai_result)
    except Exception as e:
        logger.warning("LLM explanation failed: %s", str(e))
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
        logger.error("ZK proof generation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"ZK proof generation failed: {str(e)}")

    # Step 6 — blockchain attestation (graceful — save results even if chain fails)
    tx_hash = None
    blockchain_error = None
    try:
        tx_hash = submit_attestation(proof, public_inputs)
    except Exception as e:
        blockchain_error = str(e)
        logger.warning("Blockchain attestation failed (non-fatal): %s", blockchain_error)

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

    logger.info("Portfolio & decision saved for user: %s", current_user.email)

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


# ==============================
# KYC VERIFICATION (validated)
# ==============================

@app.post("/verify-kyc")
async def verify_kyc(request: KYCRequest, current_user: UserResponse = Depends(auth.get_current_user)):

    # Input validation
    validate_kyc_request(request)

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
        logger.error("KYC ZK proof generation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"KYC ZK proof generation failed: {str(e)}")

    # Step 2 — Submit proof to RiskLensZKKYC contract on-chain (graceful)
    tx_hash = None
    blockchain_error = None
    try:
        tx_hash = submit_kyc_verification(proof, public_inputs)
    except Exception as e:
        blockchain_error = str(e)
        logger.warning("KYC blockchain submission failed (non-fatal): %s", blockchain_error)

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

    logger.info("KYC decision saved for user: %s (tx: %s)", current_user.email, tx_hash or "none")

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


# ==============================
# HISTORY ENDPOINTS
# ==============================

@app.get("/portfolio/history")
async def get_portfolio_history(current_user: UserResponse = Depends(auth.get_current_user)):
    """Fetch all saved portfolio snapshots for the logged-in user."""
    portfolios_collection = database.get_portfolios_collection()
    cursor = portfolios_collection.find(
        {"user_email": current_user.email},
        {"_id": 0}
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


# ==============================
# PRICING ENDPOINTS
# ==============================

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

    if len(symbol_list) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 symbols per request.")

    items = [{"symbol": s, "type": t} for s, t in zip(symbol_list, type_list)]
    prices = get_bulk_prices(items)

    return {"prices": prices}