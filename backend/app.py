from fastapi import FastAPI, Depends, HTTPException, status, Request, File, UploadFile
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from models import (
    PortfolioRequest, KYCProofRequest, UserCreate, UserLogin, 
    GoogleLogin, UserResponse, UserInDB, Token,
    RecommendationFeedback, SimulationRequest, BacktestRequest,
    VALID_FEEDBACK_ACTIONS
)
import auth
import database
from ai_service import run_ai_analysis
from llm_service import generate_llm_explanation
from zk_kyc_service import verify_kyc_proof, InvalidProof
from pricing_service import get_asset_price, get_bulk_prices
from simulation_service import run_simulation
from backtest_service import run_historical_backtest
from ocr_service import parse_screenshots



import asyncio
import base64
import binascii
import hashlib
import json
import os
import logging
import time
import csv
from io import StringIO
from fpdf import FPDF
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()


def utc_now_iso() -> str:
    """UTC timestamp with an explicit offset, so clients don't read it as local time."""
    return datetime.now(timezone.utc).isoformat()

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

    # bcrypt only uses the first 72 bytes, and recent versions reject longer input
    if len(user.password) < 8 or len(user.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be 8–72 characters")

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
            live_price = await run_in_threadpool(get_asset_price, asset_data["symbol"], asset_data["type"])
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

    # Step 1 — AI analysis (Phase 2 + Phase 3)
    try:
        interactions_col = database.get_interactions_collection()
        user_history = await interactions_col.find({"user_email": current_user.email}).to_list(length=100)
        
        # Fetch decision logs for Phase 3 asset-class cross-referencing
        decisions_col = database.get_decisions_collection()
        decision_logs = await decisions_col.find(
            {"user_email": current_user.email, "action": "portfolio_analysis"},
            {"_id": 0, "snapshot_hash": 1, "ai_analysis.summary.assets": 1}
        ).to_list(length=100)
        
        ai_result = await run_in_threadpool(
            run_ai_analysis,
            portfolio_dict, 
            request.risk_profile, 
            request.lookback_days,
            user_history=user_history,
            decision_logs=decision_logs
        )
    except Exception as e:
        logger.error("AI analysis failed: %s", str(e))
        raise HTTPException(status_code=400, detail=f"AI analysis failed: {str(e)}")

    # Step 2 — LLM explanation (with Phase 3 behavioral context)
    behavioral_context = ai_result.pop("_behavioral_llm_context", None)
    try:
        explanation = await run_in_threadpool(generate_llm_explanation, ai_result, behavioral_context=behavioral_context)
    except Exception as e:
        logger.warning("LLM explanation failed: %s", str(e))
        explanation = "LLM explanation unavailable at the moment."

    # Step 3 — snapshot id: hash of the holdings + time, unique per analysis.
    # Feedback and history refer to an analysis by this value.
    created_at = utc_now_iso()
    snapshot_hash = hashlib.sha256(f"{json.dumps(portfolio_dict)}|{created_at}".encode()).hexdigest()

    # Step 4 — Save portfolio snapshot and decision log
    portfolios_collection = database.get_portfolios_collection()
    await portfolios_collection.insert_one({
        "user_email": current_user.email,
        "assets": portfolio_dict["assets"],
        "risk_profile": request.risk_profile,
        "snapshot_hash": snapshot_hash,
        "created_at": created_at,
    })

    decisions_collection = database.get_decisions_collection()
    await decisions_collection.insert_one({
        "user_email": current_user.email,
        "action": "portfolio_analysis",
        "snapshot_hash": snapshot_hash,
        "ai_analysis": ai_result,
        "llm_explanation": explanation,
        "created_at": created_at,
    })

    logger.info("Portfolio & decision saved for user: %s", current_user.email)

    response = {
        "ai_analysis": ai_result,
        "llm_explanation": explanation,
        "snapshot_hash": snapshot_hash,
        "created_at": created_at,
    }
    if live_prices_used:
        response["live_prices_used"] = live_prices_used
    return response


# ==============================
# IDENTITY ATTESTATION (zero-knowledge)
# ==============================

@app.post("/verify-kyc")
async def verify_kyc(request: KYCProofRequest, current_user: UserResponse = Depends(auth.get_current_user)):
    """
    Verify an identity proof generated in the user's browser. The server never
    sees the user's details, only the proof and its public values.
    """
    try:
        proof = base64.b64decode(request.proof, validate=True)
        result = await run_in_threadpool(verify_kyc_proof, proof, request.public_inputs)
    except (ValueError, binascii.Error):
        raise HTTPException(status_code=400, detail="Proof isn't valid base64.")
    except InvalidProof as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Identity proof verification error: %s", str(e))
        raise HTTPException(status_code=500, detail="Couldn't verify the proof right now.")

    verified_at = utc_now_iso()
    await database.get_decisions_collection().insert_one({
        "user_email": current_user.email,
        "action": "kyc_verification",
        "identity_commitment_hash": result["commitment"],
        "proof_date": result["date"],
        "created_at": verified_at,
    })
    await database.get_users_collection().update_one(
        {"email": current_user.email},
        {"$set": {"kyc_verified": True, "kyc_commitment": result["commitment"], "kyc_verified_at": verified_at}},
    )
    logger.info("Identity proof verified for user: %s", current_user.email)

    return {
        "status": "verified",
        "identity_commitment_hash": result["commitment"],
        "verified_at": verified_at,
    }


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


# ==============================
# SCREENSHOT ANALYSIS (Phase 3)
# ==============================

@app.post("/portfolio/parse-screenshot")
async def extract_portfolio_from_screenshot(
    files: List[UploadFile] = File(...),
    current_user: UserResponse = Depends(auth.get_current_user)
):
    """
    Extract portfolio assets from one or more uploaded screenshots.
    Uses the AI vision model to recognize symbols, quantities, and values.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    # Optional: limit number of files to prevent abuse
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 screenshots allowed at once.")

    try:
        images_bytes = []
        for file in files:
            content = await file.read()
            images_bytes.append(content)
        
        result = await run_in_threadpool(parse_screenshots, images_bytes)
        return result
        
    except Exception as e:
        logger.error("Screenshot analysis failed for user %s: %s", current_user.email, str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# PHASE 3: BEHAVIORAL FEEDBACK
# ==============================

@app.post("/portfolio/feedback")
async def log_recommendation_feedback(
    feedback: RecommendationFeedback, 
    current_user: UserResponse = Depends(auth.get_current_user)
):
    """
    Log user interaction with AI recommendations (Accept/Reject/Modify/Ignore).
    This data drives the Phase 3 behavioral learning engine.
    """
    # Validate action
    action = feedback.action.lower()
    if action not in VALID_FEEDBACK_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{feedback.action}'. Valid actions: {', '.join(VALID_FEEDBACK_ACTIONS)}"
        )
    
    # If action is "modify", modification_details should be provided
    if action == "modify" and not feedback.modification_details:
        logger.warning("Modify action without details from user %s", current_user.email)
    
    # If market_volatility not provided, try to look it up from the decision log
    market_vol = feedback.market_volatility
    if market_vol is None:
        try:
            decisions_col = database.get_decisions_collection()
            decision = await decisions_col.find_one(
                {"snapshot_hash": feedback.snapshot_hash, "user_email": current_user.email},
                {"_id": 0, "ai_analysis.phase2.portfolio_intelligence.portfolio_volatility_pct": 1}
            )
            if decision:
                market_vol = (
                    decision.get("ai_analysis", {})
                    .get("phase2", {})
                    .get("portfolio_intelligence", {})
                    .get("portfolio_volatility_pct")
                )
        except Exception as e:
            logger.warning("Could not auto-resolve market volatility: %s", str(e))
    
    interactions_collection = database.get_interactions_collection()
    
    interaction_record = {
        "user_email": current_user.email,
        "snapshot_hash": feedback.snapshot_hash,
        "action": action,
        "modification_details": feedback.modification_details,
        "market_volatility": market_vol,
        "reasoning": feedback.reasoning,
        "created_at": utc_now_iso()
    }
    
    await interactions_collection.insert_one(interaction_record)
    logger.info("Feedback logged for user %s: %s on snapshot %s", current_user.email, action, feedback.snapshot_hash)
    
    return {"status": "success", "action_recorded": action, "message": "Feedback recorded. RiskLens will adapt to your preferences."}


# ==============================
# ANALYTICS: RISK TREND
# ==============================

@app.get("/portfolio/risk-trend")
async def get_risk_trend(current_user: UserResponse = Depends(auth.get_current_user)):
    """
    Fetch historical risk scores for the user to plot a timeline.
    """
    decisions_collection = database.get_decisions_collection()
    
    # Fetch last 50 decisions for this user
    cursor = decisions_collection.find(
        {"user_email": current_user.email, "action": "portfolio_analysis"},
        {"_id": 0, "created_at": 1, "ai_analysis.risk.risk_score": 1}
    ).sort("created_at", 1).limit(50)
    
    history = await cursor.to_list(length=50)
    
    # Format for charting
    trend = [
        {
            "timestamp": h["created_at"], 
            "risk_score": h["ai_analysis"]["risk"]["risk_score"]
        } 
        for h in history if "ai_analysis" in h and "risk" in h["ai_analysis"]
    ]
    
    return {
        "user_email": current_user.email,
        "trend": trend,
        "count": len(trend)
    }


# ==============================
# SIMULATION: WHAT-IF ENGINE
# ==============================

@app.post("/simulate")
async def simulate_portfolio(
    request: SimulationRequest, 
    current_user: UserResponse = Depends(auth.get_current_user)
):
    """
    Run a 'What-if' analysis. Identical to real analysis but 
    skips saving for speed and privacy.
    """
    # Validation
    validate_portfolio_request(request)
    
    # Process portfolio data
    portfolio_dict = request.dict()
    
    try:
        # Fetch history for Phase 3 personalization in simulation
        interactions_col = database.get_interactions_collection()
        user_history = await interactions_col.find({"user_email": current_user.email}).to_list(length=100)
        
        # Fetch decision logs for Phase 3 asset-class cross-referencing
        decisions_col = database.get_decisions_collection()
        decision_logs = await decisions_col.find(
            {"user_email": current_user.email, "action": "portfolio_analysis"},
            {"_id": 0, "snapshot_hash": 1, "ai_analysis.summary.assets": 1}
        ).to_list(length=100)
        
        sim_result = await run_in_threadpool(
            run_simulation,
            portfolio_dict, 
            request.risk_profile, 
            request.lookback_days,
            user_history=user_history
        )
        
        # LLM explanation for simulation (with behavioral context)
        behavioral_context = sim_result.pop("_behavioral_llm_context", None)
        explanation = await run_in_threadpool(generate_llm_explanation, sim_result, behavioral_context=behavioral_context)
        
        return {
            "is_simulation": True,
            "label": request.label,
            "ai_analysis": sim_result,
            "llm_explanation": explanation,
            "simulated_at": utc_now_iso()
        }
        
    except Exception as e:
        logger.error("Simulation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


# ==============================
# STRESS TESTING: BACKTEST
# ==============================

@app.post("/backtest")
async def historical_backtest(
    request: BacktestRequest, 
    current_user: UserResponse = Depends(auth.get_current_user)
):
    """
    Run a historical stress test (backtest) on the portfolio.
    Shows how the current weights would have performed in past crises.
    """
    portfolio_dict = request.dict()
    
    try:
        # Run historical backtest
        backtest_result = await run_in_threadpool(run_historical_backtest, portfolio_dict, request.event_id)
        
        # LLM explanation for the historical event
        explanation = await run_in_threadpool(generate_llm_explanation, backtest_result)
        
        return {
            "is_backtest": True,
            "event_id": request.event_id,
            "analysis": backtest_result,
            "llm_explanation": explanation,
            "generated_at": utc_now_iso()
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Backtest failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")


# ==============================
# PHASE 3: DECISION AUDIT LOG
# ==============================

@app.get("/portfolio/audit")
async def get_decision_audit(current_user: UserResponse = Depends(auth.get_current_user)):
    """
    Returns a structured audit showing:
    - What the AI recommended vs what the user actually did
    - Per-asset-class accept/reject rates
    - Overall behavioral summary and profile drift
    """
    # Fetch decision logs (AI recommendations)
    decisions_col = database.get_decisions_collection()
    decisions = await decisions_col.find(
        {"user_email": current_user.email, "action": "portfolio_analysis"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=50)
    
    # Fetch user interactions (feedback)
    interactions_col = database.get_interactions_collection()
    interactions = await interactions_col.find(
        {"user_email": current_user.email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=200)
    
    # Build feedback lookup: snapshot_hash → interaction
    feedback_lookup = {}
    for inter in interactions:
        snap = inter.get("snapshot_hash")
        if snap:
            feedback_lookup[snap] = inter
    
    # Join: for each decision, attach the user's response
    audit_trail = []
    for decision in decisions:
        snap = decision.get("snapshot_hash", "")
        user_feedback = feedback_lookup.get(snap)
        
        analysis = decision.get("ai_analysis") or {}
        risk = analysis.get("risk") or {}
        entry = {
            "timestamp": decision.get("created_at"),
            "snapshot_hash": snap,
            "ai_risk_score": risk.get("risk_score"),
            "ai_risk_level": risk.get("risk_level"),
            "had_rebalancing": bool((analysis.get("rebalancing") or {}).get("suggestions")),
            "user_action": user_feedback.get("action") if user_feedback else "no_response",
            "user_reasoning": user_feedback.get("reasoning") if user_feedback else None,
            "market_volatility": user_feedback.get("market_volatility") if user_feedback else None,
            "response_time": None  # Could compute from timestamps
        }
        audit_trail.append(entry)
    
    # Summary stats
    total_decisions = len(audit_trail)
    action_counts = {"accept": 0, "reject": 0, "modify": 0, "ignore": 0, "no_response": 0}
    for entry in audit_trail:
        action_counts[entry["user_action"]] = action_counts.get(entry["user_action"], 0) + 1
    
    responded = total_decisions - action_counts.get("no_response", 0)
    response_rate = round(responded / total_decisions, 2) if total_decisions > 0 else 0
    accept_rate = round(action_counts["accept"] / responded, 2) if responded > 0 else 0
    
    # Volatility-based pattern detection
    high_vol_rejects = 0
    high_vol_total = 0
    for entry in audit_trail:
        if entry.get("market_volatility") and entry["market_volatility"] > 30:
            high_vol_total += 1
            if entry["user_action"] == "reject":
                high_vol_rejects += 1
    
    patterns = []
    if high_vol_total > 3 and (high_vol_rejects / high_vol_total) > 0.6:
        patterns.append(
            f"You tend to reject recommendations during high volatility periods "
            f"({high_vol_rejects}/{high_vol_total} rejected when volatility > 30%)."
        )
    
    return {
        "user_email": current_user.email,
        "total_decisions": total_decisions,
        "response_rate": response_rate * 100, # Convert to percentage for display if needed, but let's stick to 0-1 and fix frontend
        "accept_rate": accept_rate * 100,
        "action_counts": action_counts,
        "volatility_patterns": {
            "high_vol_total": high_vol_total,
            "high_vol_rejects": high_vol_rejects,
            "panic_sell_probability": round((high_vol_rejects / high_vol_total * 100), 1) if high_vol_total > 0 else 0
        },
        "drifts": patterns,
        "audit_trail": audit_trail
    }


# ==============================
# PHASE 3: AUTO-IGNORE JOB
# ==============================

async def _mark_stale_as_ignored():
    """
    Find portfolio analyses older than 7 days with no user feedback
    and auto-insert an 'ignore' record.
    """
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        
        decisions_col = database.get_decisions_collection()
        interactions_col = database.get_interactions_collection()
        
        # Find old decisions
        old_decisions = await decisions_col.find(
            {"action": "portfolio_analysis", "created_at": {"$lt": cutoff}},
            {"_id": 0, "user_email": 1, "snapshot_hash": 1, "created_at": 1}
        ).to_list(length=500)
        
        auto_ignored = 0
        for decision in old_decisions:
            snap = decision.get("snapshot_hash")
            user_email = decision.get("user_email")
            
            # Check if feedback already exists
            existing = await interactions_col.find_one(
                {"snapshot_hash": snap, "user_email": user_email}
            )
            
            if not existing:
                await interactions_col.insert_one({
                    "user_email": user_email,
                    "snapshot_hash": snap,
                    "action": "ignore",
                    "modification_details": None,
                    "market_volatility": None,
                    "reasoning": "Auto-marked as ignored after 7-day window.",
                    "auto_generated": True,
                    "created_at": utc_now_iso()
                })
                auto_ignored += 1
        
        if auto_ignored > 0:
            logger.info("Auto-ignore job: marked %d stale recommendations as ignored", auto_ignored)
    
    except Exception as e:
        logger.error("Auto-ignore job failed: %s", str(e))


async def _auto_ignore_loop():
    """Background loop that runs the auto-ignore check daily."""
    # Wait 60 seconds after startup before first run
    await asyncio.sleep(60)
    while True:
        logger.info("Running auto-ignore background job...")
        await _mark_stale_as_ignored()
        await asyncio.sleep(86400)  # Run every 24 hours


@app.on_event("startup")
async def start_auto_ignore_job():
    asyncio.create_task(_auto_ignore_loop())
    logger.info("Auto-ignore background job scheduled")

# ==============================
# AUTOMATED SUMMARY REPORTING (PDF/CSV EXPORT)
# ==============================

@app.get("/portfolio/export")
async def export_portfolio(format: str = "csv", current_user: UserResponse = Depends(auth.get_current_user)):
    portfolios_col = database.get_portfolios_collection()
    decisions_col = database.get_decisions_collection()
    
    latest_portfolio = await portfolios_col.find_one({"user_email": current_user.email}, sort=[("created_at", -1)])
    if not latest_portfolio:
        raise HTTPException(status_code=404, detail="No portfolio found to export.")
        
    latest_decision = await decisions_col.find_one({"user_email": current_user.email, "snapshot_hash": latest_portfolio["snapshot_hash"]})
    risk_score = latest_decision.get("ai_analysis", {}).get("risk", {}).get("risk_score", "N/A") if latest_decision else "N/A"
    
    assets = latest_portfolio.get("assets", [])
    
    if format.lower() == "csv":
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Symbol", "Type", "Quantity", "Value ($)"])
        for a in assets:
            writer.writerow([a.get("symbol"), a.get("type"), a.get("quantity"), a.get("value")])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=RiskLens_Export_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"}
        )
    elif format.lower() == "pdf":
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(200, 10, txt="RiskLens - Portfolio Summary Report", ln=True, align='C')
        
        pdf.set_font("helvetica", "", 12)
        pdf.cell(200, 10, txt=f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC", ln=True, align='C')
        pdf.cell(200, 10, txt=f"User: {current_user.email}", ln=True, align='C')
        pdf.cell(200, 10, txt=f"Risk Score: {risk_score} / 5", ln=True, align='C')
        pdf.ln(10)
        
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(40, 10, "Symbol", border=1)
        pdf.cell(40, 10, "Type", border=1)
        pdf.cell(40, 10, "Quantity", border=1)
        pdf.cell(40, 10, "Value ($)", border=1)
        pdf.ln(10)
        
        pdf.set_font("helvetica", "", 12)
        total_val = 0
        for a in assets:
            pdf.cell(40, 10, str(a.get("symbol", "")), border=1)
            pdf.cell(40, 10, str(a.get("type", "")), border=1)
            q = a.get("quantity")
            pdf.cell(40, 10, str(q) if q is not None else "-", border=1)
            v = a.get("value")
            if v:
                total_val += float(v)
            pdf.cell(40, 10, f"${v:,.2f}" if v else "-", border=1)
            pdf.ln(10)
            
        pdf.ln(5)
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(120, 10, "Total Portfolio Value:", border=0, align="R")
        pdf.cell(40, 10, f"${total_val:,.2f}", border=0)
        
        pdf_bytes = pdf.output()
        content_bytes = bytes(pdf_bytes) if isinstance(pdf_bytes, bytearray) else (pdf_bytes.encode('latin1') if isinstance(pdf_bytes, str) else pdf_bytes)
        return Response(content=content_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=RiskLens_Export_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"})
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Only csv and pdf are supported.")


