from typing import Dict
import json


class PortfolioAI:
    """
    Phase 1 – Deterministic Portfolio Intelligence Engine
    Now supports Risk Profiles.
    """

    # -------------------------
    # Risk Weights
    # -------------------------

    RISK_WEIGHTS = {
        "bond": 1,
        "etf": 2,
        "stock": 3,
        "commodity": 3,
        "crypto": 5
    }

    # -------------------------
    # Risk Profile Ideal Allocations
    # -------------------------

    IDEAL_ALLOCATIONS = {
        "conservative": {
            "stock": 30,
            "crypto": 5,
            "bond": 50,
            "commodity": 10,
            "etf": 5
        },
        "balanced": {
            "stock": 50,
            "crypto": 10,
            "bond": 25,
            "commodity": 10,
            "etf": 5
        },
        "aggressive": {
            "stock": 60,
            "crypto": 20,
            "bond": 10,
            "commodity": 5,
            "etf": 5
        }
    }

    REBALANCE_THRESHOLD = 15

    # -------------------------
    # Constructor
    # -------------------------

    def __init__(self, portfolio_data: Dict, risk_profile: str = "balanced"):
        self.portfolio = portfolio_data
        self.total_value = 0
        self.asset_allocations = {}
        self.class_allocations = {}

        if risk_profile not in self.IDEAL_ALLOCATIONS:
            raise ValueError("Invalid risk profile. Choose: conservative, balanced, aggressive")

        self.risk_profile = risk_profile
        self.ideal_allocation = self.IDEAL_ALLOCATIONS[risk_profile]

    # -------------------------
    # Step 1 — Aggregation
    # -------------------------

    def aggregate(self):
        assets = self.portfolio.get("assets", [])

        if not assets:
            raise ValueError("Portfolio contains no assets.")

        self.total_value = sum(asset["value"] for asset in assets)

        if self.total_value <= 0:
            raise ValueError("Total portfolio value must be positive.")

        # Asset allocation
        for asset in assets:
            symbol = asset["symbol"]
            value = asset["value"]
            allocation = (value / self.total_value) * 100
            self.asset_allocations[symbol] = round(allocation, 2)

        # Asset class allocation
        class_totals = {}
        for asset in assets:
            asset_type = asset["type"]
            class_totals[asset_type] = class_totals.get(asset_type, 0) + asset["value"]

        for asset_type, value in class_totals.items():
            allocation = (value / self.total_value) * 100
            self.class_allocations[asset_type] = round(allocation, 2)

    # -------------------------
    # Step 2 — Diversification (HHI)
    # -------------------------

    def calculate_diversification(self):
        hhi = 0

        for allocation_percent in self.asset_allocations.values():
            weight = allocation_percent / 100
            hhi += weight ** 2

        hhi = round(hhi, 4)

        if hhi < 0.15:
            level = "Highly Diversified"
            score = 90
        elif hhi < 0.25:
            level = "Moderately Diversified"
            score = 70
        else:
            level = "Concentrated"
            score = 40

        return {
            "hhi": hhi,
            "diversification_level": level,
            "score": score,
            "explanation": f"HHI = {hhi}. Lower values indicate better diversification."
        }

    # -------------------------
    # Step 3 — Risk Scoring
    # -------------------------

    def calculate_risk(self):
        weighted_risk = 0

        for asset_class, allocation in self.class_allocations.items():
            weight = self.RISK_WEIGHTS.get(asset_class, 3)
            weighted_risk += (allocation / 100) * weight

        weighted_risk = round(weighted_risk, 2)

        if weighted_risk < 2:
            level = "Low"
        elif weighted_risk < 3.5:
            level = "Moderate"
        else:
            level = "High"

        return {
            "risk_score": weighted_risk,
            "risk_level": level,
            "explanation": "Risk calculated using weighted exposure to asset classes."
        }

    # -------------------------
    # Step 4 — Rebalancing (Profile-Based)
    # -------------------------

    def generate_rebalancing(self):
        suggestions = []

        for asset_class, ideal_pct in self.ideal_allocation.items():
            actual_pct = self.class_allocations.get(asset_class, 0)
            deviation = actual_pct - ideal_pct

            if abs(deviation) > self.REBALANCE_THRESHOLD:
                if deviation > 0:
                    suggestions.append(
                        f"Reduce {asset_class} exposure by approx {round(abs(deviation), 2)}% "
                        f"(Profile: {self.risk_profile})."
                    )
                else:
                    suggestions.append(
                        f"Increase {asset_class} exposure by approx {round(abs(deviation), 2)}% "
                        f"(Profile: {self.risk_profile})."
                    )

        return {
            "profile_used": self.risk_profile,
            "suggestions": suggestions,
            "explanation": "Suggestions based on selected risk profile."
        }

    # -------------------------
    # Final Pipeline
    # -------------------------

    def analyze(self):
        self.aggregate()

        diversification = self.calculate_diversification()
        risk = self.calculate_risk()
        rebalancing = self.generate_rebalancing()

        return {
            "summary": {
                "total_value": self.total_value,
                "asset_allocations_percent": self.asset_allocations,
                "class_allocations_percent": self.class_allocations
            },
            "diversification": diversification,
            "risk": risk,
            "rebalancing": rebalancing
        }


# ---------------------------------------------------------
# Execution Block
# ---------------------------------------------------------

if __name__ == "__main__":
    print("Running RiskLens Phase 1 AI Engine with Risk Profiles...\n")

    sample_portfolio = {
        "assets": [
            {"symbol": "AAPL", "type": "stock", "value": 20000},
            {"symbol": "BTC", "type": "crypto", "value": 15000},
            {"symbol": "Gold", "type": "commodity", "value": 5000},
            {"symbol": "US Bonds", "type": "bond", "value": 10000}
        ]
    }

    # Change profile here to test:
    ai = PortfolioAI(sample_portfolio, risk_profile="conservative")
    result = ai.analyze()

    print(json.dumps(result, indent=4))
