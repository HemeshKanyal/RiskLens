"""
RiskLens Phase 2 — End-to-End Test
Tests the full pipeline with a sample portfolio.
"""

import sys
import os
import json

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def separator(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def test_full_pipeline():
    """Test the complete Phase 2 pipeline step by step."""

    sample_portfolio = {
        "assets": [
            {"symbol": "AAPL", "type": "stock", "value": 20000},
            {"symbol": "BTC", "type": "crypto", "value": 15000},
            {"symbol": "Gold", "type": "commodity", "value": 5000},
            {"symbol": "US Bonds", "type": "bond", "value": 10000},
        ]
    }

    # ------------------------------------------------------------------
    # Step 1: Data Collection
    # ------------------------------------------------------------------
    separator("Step 1: Data Collection")
    from ai_phase2.data_collector import MarketDataCollector

    collector = MarketDataCollector(lookback_days=90)
    market_data = collector.fetch_from_portfolio(sample_portfolio)

    assert len(market_data) > 0, "❌ No market data fetched!"
    for symbol, df in market_data.items():
        assert len(df) > 10, f"❌ Insufficient data for {symbol}"
        print(f"  ✅ {symbol}: {len(df)} days fetched")

    # ------------------------------------------------------------------
    # Step 2: Feature Engineering
    # ------------------------------------------------------------------
    separator("Step 2: Feature Engineering")
    from ai_phase2.feature_engine import FeatureEngine

    engine = FeatureEngine()
    features = engine.engineer(market_data)

    assert len(features) > 0, "❌ No features engineered!"
    for symbol, df in features.items():
        assert "daily_return" in df.columns, f"❌ Missing daily_return for {symbol}"
        assert "rolling_vol" in df.columns, f"❌ Missing rolling_vol for {symbol}"
        assert "cumulative_return" in df.columns, f"❌ Missing cumulative_return for {symbol}"
        print(f"  ✅ {symbol}: {len(df)} data points with all features")

    # ------------------------------------------------------------------
    # Step 3: Risk Metrics
    # ------------------------------------------------------------------
    separator("Step 3: Risk Metrics")
    from ai_phase2.risk_metrics import RiskMetrics

    risk_calc = RiskMetrics()
    risk_result = risk_calc.calculate(features)

    assert "per_asset" in risk_result, "❌ Missing per_asset metrics"
    assert "correlation_matrix" in risk_result, "❌ Missing correlation matrix"

    for symbol, metrics in risk_result["per_asset"].items():
        assert "volatility_pct" in metrics, f"❌ Missing volatility for {symbol}"
        assert "max_drawdown_pct" in metrics, f"❌ Missing drawdown for {symbol}"
        assert "sharpe_ratio" in metrics, f"❌ Missing Sharpe for {symbol}"
        print(f"  ✅ {symbol}: vol={metrics['volatility_pct']}%, "
              f"dd={metrics['max_drawdown_pct']}%, sharpe={metrics['sharpe_ratio']}")

    if risk_result["correlation_matrix"]:
        print(f"  ✅ Correlation matrix: {len(risk_result['correlation_matrix'])}×{len(risk_result['correlation_matrix'])} assets")

    # ------------------------------------------------------------------
    # Step 4: Portfolio Intelligence
    # ------------------------------------------------------------------
    separator("Step 4: Portfolio Intelligence")
    from ai_phase2.portfolio_intelligence import PortfolioIntelligence

    intel = PortfolioIntelligence()
    portfolio_intel = intel.analyze(risk_result, sample_portfolio)

    assert "portfolio_volatility_pct" in portfolio_intel, "❌ Missing portfolio vol"
    assert "diversification_ratio" in portfolio_intel, "❌ Missing div ratio"
    assert "risk_contributions" in portfolio_intel, "❌ Missing risk contributions"

    print(f"  ✅ Portfolio Volatility: {portfolio_intel['portfolio_volatility_pct']}%")
    print(f"  ✅ Diversification Ratio: {portfolio_intel['diversification_ratio']}")
    print(f"  ✅ Risk Contributions: {json.dumps(portfolio_intel['risk_contributions'])}")
    print(f"  ✅ High-Corr Pairs: {len(portfolio_intel['high_correlation_pairs'])}")

    # ------------------------------------------------------------------
    # Step 6: Insight Generation
    # ------------------------------------------------------------------
    separator("Step 6: Insight Generation")
    from ai_phase2.insight_generator import InsightGenerator

    insight_gen = InsightGenerator()
    insights = insight_gen.generate(risk_result["per_asset"], portfolio_intel)

    assert "asset_insights" in insights, "❌ Missing asset insights"
    assert "portfolio_insights" in insights, "❌ Missing portfolio insights"
    assert "summary" in insights, "❌ Missing summary"

    print(f"  ✅ Asset Insights: {len(insights['asset_insights'])} generated")
    print(f"  ✅ Portfolio Insights: {len(insights['portfolio_insights'])} generated")
    print(f"  ✅ Summary: {insights['summary'][:80]}...")

    # ------------------------------------------------------------------
    # Step 5: Full Pipeline (AI Engine v2)
    # ------------------------------------------------------------------
    separator("Step 5: Full Analysis (AI Engine v2)")
    from ai_phase2.ai_engine_v2 import PortfolioAIv2

    ai = PortfolioAIv2(sample_portfolio, risk_profile="balanced")
    full_result = ai.analyze()

    assert "risk" in full_result, "❌ Missing combined risk"
    assert "phase2" in full_result, "❌ Missing Phase 2 data"
    assert "summary" in full_result, "❌ Missing portfolio summary"

    risk = full_result["risk"]
    print(f"  ✅ Phase 1 Risk Score: {risk.get('phase1_score', 'N/A')}")
    print(f"  ✅ Phase 2 Risk Score: {risk.get('phase2_score', 'N/A')}")
    print(f"  ✅ Combined Score:     {risk['risk_score']} ({risk['risk_level']})")
    print(f"  ✅ Explanation:        {risk['explanation']}")

    # ------------------------------------------------------------------
    # Final
    # ------------------------------------------------------------------
    separator("ALL TESTS PASSED ✅")
    print("  Phase 2 pipeline is fully operational.\n")

    # Save full output for inspection
    output_path = os.path.join(os.path.dirname(__file__), "test_output.json")
    with open(output_path, "w") as f:
        json.dump(full_result, f, indent=4, default=str)
    print(f"  Full output saved to: {output_path}")


if __name__ == "__main__":
    test_full_pipeline()
