# RiskLens codebase guide

How the code is organised, how a request flows through it, and where to make
common changes. For setup and deployment see the [README](../README.md).

## The big picture

```
Browser (Next.js, risklens-frontend/)
  │  REST + JWT                      ┌─ ai_phase1/  asset-class rules
  ▼                                  ├─ ai_phase2/  market data & risk metrics
FastAPI (backend/app.py) ────────────┼─ ai_phase3/  behaviour (tailors wording)
  │        │         │               └─ llm_client  Ollama or Gemini
  │        │         └─ bb verify  ← zk/risklens_kyc_circuit/vk (identity proofs)
  ▼        ▼
MongoDB   Yahoo Finance (yfinance)
```

- The **frontend** is a Next.js 16 App Router app. It renders the landing page,
  auth pages and the dashboard, and generates identity proofs in the browser.
- The **backend** is a single FastAPI app. It owns auth, runs the analysis
  pipeline, stores results in MongoDB and verifies identity proofs.
- The **analysis engine** lives in plain Python packages (`ai_phase1/2/3`) so
  it can be tested without the web server.

## Repository layout

| Path | What's there |
|---|---|
| `backend/app.py` | All HTTP endpoints, validation, rate limiting, persistence |
| `backend/auth.py` | Password hashing (bcrypt), JWT creation/validation, Google sign-in |
| `backend/database.py` | Motor (async MongoDB) client and collection helpers |
| `backend/models.py` | Pydantic request/response models |
| `backend/ai_service.py` | Glue: runs the engine (phase 2 + 3) for a portfolio |
| `backend/llm_client.py` | One interface to the language model (Ollama or Gemini) |
| `backend/llm_service.py` | Builds the prompt and key facts for the written explanation |
| `backend/ocr_service.py` | Screenshot import: image → holdings via the vision model |
| `backend/zk_kyc_service.py` | Verifies identity proofs with the `bb` CLI |
| `backend/pricing_service.py` | Live prices for assets entered by quantity |
| `backend/simulation_service.py`, `backtest_service.py` | What-if runs and crisis replays |
| `backend/Dockerfile`, `render.yaml` | Production image and Render blueprint |
| `ai_phase1/ai_engine.py` | Asset-class risk score, diversification (HHI), rebalancing |
| `ai_phase2/` | Market data collection, features, risk metrics, insights, backtests |
| `ai_phase3/behavioral_engine.py` | Learns from accept/decline feedback |
| `zk/risklens_kyc_circuit/` | Noir circuit for the identity check, its tests and verification key |
| `risklens-frontend/` | The web app (see below) |
| `scripts/dev.sh` | Runs the API and the app locally |
| `scripts/build-circuit.sh` | Rebuilds the circuit and syncs its artifacts |

## Request flow: analysing a portfolio

`POST /analyze` in `backend/app.py`:

1. **Validate** the holdings (`validate_portfolio_request`).
2. **Price** holdings given by quantity (`pricing_service.get_asset_price`).
3. **Analyse** (`ai_service.run_ai_analysis`, run in a thread pool):
   - `ai_phase1.PortfolioAI` scores the asset-class mix and suggests rebalancing.
   - `ai_phase2.PortfolioAIv2` fetches daily prices for the lookback window,
     computes per-asset and portfolio metrics, and merges both into one score.
   - `ai_phase3.BehavioralEngine` summarises how the user responded to past
     suggestions. This only shapes the explanation; it never changes the score.
4. **Explain** (`llm_service.generate_llm_explanation`): the prompt gets labelled
   figures plus precomputed "key facts" (rankings, which driver is bigger), so
   the model rephrases rather than reasons. Markdown is stripped.
5. **Save** a portfolio snapshot and a decision log, keyed by `snapshot_hash`
   (a hash of the holdings and timestamp; feedback refers to it).

`POST /simulate` runs steps 1–4 without saving. `POST /backtest` replays the
current weights through a historical window (`ai_phase2/backtest_engine.py`).

### The risk model

| Part | Weight | How it's computed |
|---|---|---|
| Asset-class mix | 40% | Weighted average of class risk: bond 1, ETF 2, stock 3, commodity 3, crypto 5 (`ai_phase1`) |
| Market behaviour | 60% | Annualised portfolio volatility mapped to 0–5: 0–10% → 0–1, 10–25% → 1–3, 25–50% → 3–5 (`ai_engine_v2._vol_to_risk_score`) |

Levels: under 1 Low, under 3 Moderate, otherwise High. Other figures:
volatility is annualised with √252; Sharpe uses a 4% risk-free rate;
diversification uses the Herfindahl index (HHI) and the diversification ratio;
risk contributions are each holding's share of portfolio variance.
Rebalancing suggestions fire when a class is more than 15 points away from the
profile's target mix (`IDEAL_ALLOCATIONS`).

## The identity check (zero knowledge)

The goal: prove "18 or older and not from a restricted country" without the
server seeing name, birth date or document number.

1. **Browser** (`risklens-frontend/lib/zk-identity.ts`): hashes the name and
   document number (SHA-256, truncated to a field element), adds a random salt,
   runs the circuit with `noir_js` and proves it with `bb.js` (UltraHonk,
   `noir-recursive` target). Only the proof and two public values are sent.
2. **Circuit** (`zk/risklens_kyc_circuit/src/main.nr`): checks `today − dob ≥
   180000` on YYYYMMDD dates (exactly 18 years), checks the country code, and
   returns a salted Pedersen commitment of the details. `nargo test` runs its tests.
3. **Server** (`backend/zk_kyc_service.py`): checks the date is current (±1
   day), runs `bb verify` against the committed verification key, and stores
   only the commitment.

The browser libraries (`@noir-lang/noir_js`, `@aztec/bb.js`) and the CLI
(`nargo`, `bb`) must be the same pair of versions. After editing the circuit,
run `scripts/build-circuit.sh` and commit both artifacts it updates.

## Frontend

```
risklens-frontend/
  app/                    routes (App Router)
    page.tsx              landing page (the notebook)
    login/, signup/       auth pages
    dashboard/            signed-in area; layout.tsx guards it
  components/
    ui/                   design-system primitives (Button, Card, Field, …)
    analysis/             results: RiskMeter, HoldingsTable, Findings, charts
    dashboard/, portfolio/, auth/
    landing/notebook/     landing hero, chapters, drawings, parallax
  lib/
    api.ts                axios client; attaches the JWT, handles 401
    auth-context.tsx      current user, login/logout
    analysis.ts           turns the raw analysis into the view the UI shows
    types.ts              API types (mirror backend responses)
    zk-identity.ts        in-browser proof generation
    chapters.ts           page numerals/captions shared by sidebar and headers
```

**Design system.** Colours are semantic tokens in `app/globals.css` (`bg`,
`surface`, `fg`, `muted`, `accent`, status and chart series) with a light
"parchment" and a dark "candlelight" set; components only use the token names
(`bg-surface`, `text-muted`, …). Fonts are loaded once in `lib/fonts.ts`:
Inter (UI and titles), Instrument Serif (`font-serif`) and IM Fell English
(`font-fell`, captions). Chart colours are a validated categorical order;
status colours (`positive`, `warning`, `negative`) are reserved for risk state.

**Landing page.** `components/landing/notebook/` draws everything in SVG.
Each study is a component in its own coordinates; `Hero.tsx` places them on a
1600×900 sheet. `ParallaxScene.tsx` sets `--px/--py` from the pointer and each
layer moves by its `--depth`. Styles are in `notebook.css`, loaded only by the
landing page.

## Data model (MongoDB, database `risklens`)

| Collection | One document per | Notable fields |
|---|---|---|
| `users` | account | `email`, `hashed_password`, `kyc_verified`, `kyc_commitment`, `kyc_verified_at` |
| `portfolios` | saved analysis (holdings) | `assets`, `risk_profile`, `snapshot_hash`, `created_at` |
| `decision_logs` | analysis or identity check | `action`, `ai_analysis`, `llm_explanation`, `identity_commitment_hash` |
| `user_interactions` | feedback on a suggestion | `snapshot_hash`, `action` (accept/modify/reject/ignore) |

Timestamps are ISO 8601 UTC. A background task marks suggestions with no
feedback after 7 days as "ignore".

## Configuration

All backend settings are environment variables; see `backend/.env.example`.
The frontend needs `NEXT_PUBLIC_API_URL`. Secrets never go in the repository.

## Common changes

| To… | Edit |
|---|---|
| Change class risk weights or target mixes | `ai_phase1/ai_engine.py` (`RISK_WEIGHTS`, `IDEAL_ALLOCATIONS`) |
| Change the 40/60 blend or volatility bands | `ai_phase2/ai_engine_v2.py` |
| Change the explanation's wording or rules | `backend/llm_service.py` (prompt, `_key_facts`) |
| Switch language model | env: `LLM_PROVIDER`, `GEMINI_MODEL` / `OLLAMA_MODEL` |
| Add a stress-test event | `ai_phase2/backtest_engine.py` and the list in `risklens-frontend/app/dashboard/analytics/page.tsx` |
| Change colours or fonts | `risklens-frontend/app/globals.css`, `lib/fonts.ts` |
| Add a dashboard page | `app/dashboard/<name>/page.tsx` and an entry in `lib/chapters.ts` |
| Change the identity rules | `zk/risklens_kyc_circuit/src/main.nr`, then `scripts/build-circuit.sh` |
