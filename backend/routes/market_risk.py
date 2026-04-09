"""
RiskLens Phase 2 — Step 7: FastAPI Market Risk Endpoints
Exposes Phase 2 analysis as REST API endpoints.
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ai_phase2.data_collector import MarketDataCollector
from ai_phase2.feature_engine import FeatureEngine
from ai_phase2.risk_metrics import RiskMetrics
from ai_phase2.portfolio_intelligence import PortfolioIntelligence
from ai_phase2.insight_generator import InsightGenerator
from ai_phase2.ai_engine_v2 import PortfolioAIv2


# ------------------------------------------------------------------
# Router
# ------------------------------------------------------------------

router = APIRouter(prefix="/api/market-risk", tags=["Market Risk"])


# ------------------------------------------------------------------
# Request / Response Models
# ------------------------------------------------------------------

class Asset(BaseModel):
    symbol: str
    type: str
    value: float = Field(gt=0)


class PortfolioRequest(BaseModel):
    assets: List[Asset]
    risk_profile: str = "balanced"
    lookback_days: int = 90


class SymbolRequest(BaseModel):
    symbol: str
    lookback_days: int = 90


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.post("/analyze")
async def analyze_portfolio(request: PortfolioRequest) -> Dict[str, Any]:
    """
    Full Phase 1 + Phase 2 analysis of a portfolio.

    Accepts portfolio assets with values, returns combined risk analysis
    with market-data-driven metrics, insights, and recommendations.
    """
    try:
        portfolio_data = {
            "assets": [asset.model_dump() for asset in request.assets]
        }

        ai = PortfolioAIv2(
            portfolio_data,
            risk_profile=request.risk_profile,
            lookback_days=request.lookback_days
        )

        result = ai.analyze()
        return {"status": "success", "data": result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/asset/{symbol}")
async def get_asset_metrics(symbol: str, lookback_days: int = 90) -> Dict[str, Any]:
    """
    Get historical data and risk metrics for a single asset.
    """
    try:
        # Fetch data
        collector = MarketDataCollector(lookback_days=lookback_days)
        data = collector.fetch([symbol])

        if not data:
            raise HTTPException(status_code=404, detail=f"No market data found for {symbol}")

        # Engineer features
        engine = FeatureEngine()
        features = engine.engineer(data)

        if not features:
            raise HTTPException(status_code=500, detail=f"Feature engineering failed for {symbol}")

        # Calculate metrics
        metrics = RiskMetrics()
        result = metrics.calculate(features)

        asset_metrics = result["per_asset"].get(symbol, {})

        # Get price history for charting
        df = features[symbol]
        price_history = [
            {"date": row["date"].strftime("%Y-%m-%d"), "close": round(row["close"], 2)}
            for _, row in df.iterrows()
        ]

        return {
            "status": "success",
            "data": {
                "symbol": symbol,
                "metrics": asset_metrics,
                "price_history": price_history,
                "data_points": len(df),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data for {symbol}: {str(e)}")


@router.post("/quick-risk")
async def quick_risk_score(request: PortfolioRequest) -> Dict[str, Any]:
    """
    Quick Phase 2-only risk assessment (no Phase 1 merge).
    Faster endpoint for real-time dashboard updates.
    """
    try:
        portfolio_data = {
            "assets": [asset.model_dump() for asset in request.assets]
        }

        # Run Phase 2 pipeline only
        collector = MarketDataCollector(lookback_days=request.lookback_days)
        market_data = collector.fetch_from_portfolio(portfolio_data)

        if not market_data:
            raise HTTPException(status_code=404, detail="No market data available for portfolio assets")

        engine = FeatureEngine()
        features = engine.engineer(market_data)

        metrics = RiskMetrics()
        risk_result = metrics.calculate(features)

        intel = PortfolioIntelligence()
        portfolio_intel = intel.analyze(risk_result, portfolio_data)

        insight_gen = InsightGenerator()
        insights = insight_gen.generate(risk_result["per_asset"], portfolio_intel)

        return {
            "status": "success",
            "data": {
                "portfolio_volatility": portfolio_intel["portfolio_volatility_pct"],
                "diversification_ratio": portfolio_intel["diversification_ratio"],
                "risk_contributions": portfolio_intel["risk_contributions"],
                "summary": insights["summary"],
                "top_insights": insights["portfolio_insights"][:3],
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick risk analysis failed: {str(e)}")
