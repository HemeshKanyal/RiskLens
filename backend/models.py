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


class KYCRequest(BaseModel):
    full_name: str
    date_of_birth: str        # "YYYY-MM-DD"
    country_code: int          # numeric code (avoid 1,2,3 which are blacklisted)
    document_id: str           # passport / national ID number
    age: int


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

class Token(BaseModel):
    access_token: str
    token_type: str

class UserInDB(UserResponse):
    hashed_password: str | None = None
    google_id: str | None = None