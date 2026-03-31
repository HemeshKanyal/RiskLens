from pydantic import BaseModel
from typing import List


class Asset(BaseModel):
    symbol: str
    type: str
    value: float


class PortfolioRequest(BaseModel):
    assets: List[Asset]
    risk_profile: str = "balanced"


class AnalysisResponse(BaseModel):
    ai_analysis: dict
    llm_explanation: str


class KYCRequest(BaseModel):
    full_name: str
    date_of_birth: str        # "YYYY-MM-DD"
    country_code: int          # numeric code (avoid 1,2,3 which are blacklisted)
    document_id: str           # passport / national ID number
    age: int