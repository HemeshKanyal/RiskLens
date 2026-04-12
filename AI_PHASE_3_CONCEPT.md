# RiskLens AI Phase 3: Behavioral Intelligence

## Concept Overview
Phase 3 moves from **Market Intelligence** (Phase 2) to **Behavioral Intelligence**. While Phase 2 tells the user what the *market* is doing, Phase 3 learns what the *user* is doing and adapts the platform to their specific decision-making style.

---

## How it Works (The "Feedback Loop")

### 1. Recommendation Tracking
Every time the AI provides a rebalancing recommendation (e.g., "Sell $2k of BTC to buy Gold"), the backend generates a unique `RecommendationID`.

### 2. User Interaction Sensing
When the user sees this on the frontend, Phase 3 tracks their response:
- **Accept**: User indicates they will follow the advice.
- **Reject**: User explicitly dismisses the advice.
- **Modify**: User executes a partial version of the advice.
- **Ignore**: User does nothing within a 7-day window.

### 3. Profile "Drift" Analysis
The AI compares the **Stated Risk Profile** (e.g., "Conservative") against the **Actual Behavior**.
- *Example*: A user says they are "Conservative" but consistently rejects "Bond" buys and accepts "Crypto" buys.
- *AI Insight*: "Your stated profile is Conservative, but your actions align more with an Aggressive profile. Should we update your settings?"

### 4. Personalized Explainability
The LLM (Llama 3.1) uses this behavioral history to tailor its tone and focus.
- *Phase 2 Insight*: "Gold is recommended due to low correlation with BTC."
- *Phase 3 Insight*: "Based on your preference for keeping BTC during dips, we recommend a smaller Gold hedge than usual to ensure you remain comfortable with your portfolio."

---

## Technical Components

### A. Feedback Collection
A new MongoDB collection `user_interactions` stores:
- `user_id`
- `recommendation_id`
- `action` (Accept/Reject/Modify)
- `timestamp`
- `current_market_volatility` (context when the decision was made)

### B. The Personalization Engine
A new module in the AI layer that calculates a **Personalization Offset**. 
- It adjusts the "Aggressiveness" multiplier in the Phase 2 formulas based on the user's historical "Accept" rate for high-volatility assets.

### C. Decision Audit Log
A more robust history that shows not just what the AI said, but what the user did, allowing the user to reflect on their own biases (e.g., "I tend to panic-sell when Volatility > 30%").

---

## Why this is a "Phase 3" Feature
This requires a history of user data to be effective. Phase 1 and 2 can work for a brand-new user on Day 1. Phase 3 becomes powerful on Day 30, after the user has interacted with the platform multiple times.
