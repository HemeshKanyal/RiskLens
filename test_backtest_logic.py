"""
RiskLens Stress Test — COVID 2020 Backtest
Verifies that the backtest engine can fetch historical data and calculate drawdown.
"""

from ai_phase2.backtest_engine import BacktestEngine
import json

def test_covid_backtest():
    portfolio = {
        "assets": [
            {"symbol": "AAPL", "type": "stock", "value": 10000},
            {"symbol": "BTC", "type": "crypto", "value": 10000},
            {"symbol": "US Bonds", "type": "bond", "value": 5000},
        ]
    }
    
    engine = BacktestEngine()
    print("Running COVID 2020 Backtest...")
    
    result = engine.run_event_backtest(portfolio, "COVID_2020")
    
    print(f"\nEvent: {result['event_name']}")
    print(f"Worst Asset: {result['worst_performing_asset']} (Drawdown: {result['worst_asset_drawdown']}%)")
    print(f"Portfolio Diversification: {result['portfolio_metrics']['diversification_ratio']}")
    
    # Save output
    with open("backtest_debug.json", "w") as f:
        json.dump(result, f, indent=4)
    print("\nFull result saved to backtest_debug.json")

if __name__ == "__main__":
    test_covid_backtest()
