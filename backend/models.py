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