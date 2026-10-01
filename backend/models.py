from pydantic import BaseModel
from typing import List, Optional


class Asset(BaseModel):
    symbol: str
    type: str
    value: Optional[float] = None       # if omitted, auto-calculated from live price × quantity
    quantity: Optional[float] = None     # number of units held (e.g. 2.5 BTC, 100 shares of AAPL)


class PortfolioRequest(BaseModel):
    assets: List[Asset]
    risk_profile: str = "balanced"
    lookback_days: int = 90


class AnalysisResponse(BaseModel):
    ai_analysis: dict
    llm_explanation: str


class KYCProofRequest(BaseModel):
    proof: str                 # base64 UltraHonk proof, generated in the browser
    public_inputs: List[str]   # [today YYYYMMDD, identity commitment], 0x-hex fields


# --- Auth Models ---

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLogin(BaseModel):
    google_id_token: str

class UserResponse(BaseModel):
    email: str
    full_name: str
    is_active: bool = True
    kyc_verified: bool = False
    kyc_verified_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserInDB(UserResponse):
    hashed_password: str | None = None
    google_id: str | None = None


# --- Phase 3 & Simulation Models ---

VALID_FEEDBACK_ACTIONS = {"accept", "reject", "modify", "ignore"}

class RecommendationFeedback(BaseModel):
    snapshot_hash: str         # The hash of the portfolio that generated the recommendation
    action: str                # "accept", "reject", "modify", "ignore"
    modification_details: Optional[str] = None   # What the user changed (for "modify" action)
    market_volatility: Optional[float] = None     # Portfolio volatility at decision time
    reasoning: Optional[str] = None


class SimulationRequest(PortfolioRequest):
    """
    Simulation is identical to a portfolio request but 
    typically isn't meant for long-term storage in the main history.
    """
    label: Optional[str] = "What-if Scenario"


class BacktestRequest(BaseModel):
    assets: List[Asset]
    event_id: str               # e.g. "COVID_2020", "CRYPTO_WINTER_2022"
