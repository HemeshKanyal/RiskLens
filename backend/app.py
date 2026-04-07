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

import hashlib
import json

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
def analyze_portfolio(request: PortfolioRequest, current_user: UserResponse = Depends(auth.get_current_user)):

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


@app.post("/verify-kyc")
def verify_kyc(request: KYCRequest, current_user: UserResponse = Depends(auth.get_current_user)):

    # Step 1 — Generate ZK proof from user's KYC data
    proof, public_inputs, identity_hash = generate_kyc_proof(
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        country_code=request.country_code,
        document_id=request.document_id,
        age=request.age
    )

    # Step 2 — Submit proof to RiskLensZKKYC contract on-chain
    tx_hash = submit_kyc_verification(proof, public_inputs)

    return {
        "status": "KYC verified on-chain",
        "identity_commitment_hash": identity_hash,
        "zk_proof": proof,
        "public_inputs": public_inputs,
        "blockchain_tx": tx_hash
    }