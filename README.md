# RiskLens

Portfolio risk and diversification analysis, explained in plain language.
Enter your holdings and RiskLens measures volatility, concentration and
correlation, shows which holdings carry the most risk, replays past crises,
and writes a short explanation. An optional identity check uses a
zero-knowledge proof made in your browser, so your details never leave your
device.

> Educational tool, not investment advice.

**Live:** <https://risklens.hemeshkanyal.com> · **Code guide:** [docs/CODEBASE.md](docs/CODEBASE.md)

## Features

- **Risk score (0–5)**: 40% asset-class mix, 60% measured volatility, with each part shown
- **Where the risk comes from**: each holding's share of risk next to its share of value
- **Correlation and diversification**: pairs that move together, diversification ratio
- **Stress tests**: replay current holdings through 2008, 2020 and 2022
- **Plain-language explanation** from a language model (Gemini or a local Ollama model)
- **Screenshot import** of brokerage holdings
- **Private identity check**: a Noir zero-knowledge proof generated in the browser, verified by the server
- **History, trends and decision patterns** across saved analyses

## Stack

| Part | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts, noir_js + bb.js |
| Backend | FastAPI, Motor (MongoDB), pandas/numpy, yfinance |
| Language model | Google Gemini (production) or Ollama (local) |
| Proofs | Noir 1.0.0-beta.22, Barretenberg 5.0.0-nightly.20260522 |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

## Run locally

**Prerequisites:** Node.js 20+, Python 3.12+, Docker (for MongoDB), and either
a Gemini API key or [Ollama](https://ollama.com). For the identity check you
also need Barretenberg (`noirup -v 1.0.0-beta.22 && bbup`).

```bash
# MongoDB (MongoDB 8 can't start on Linux kernel 6.19+, so use 7.0)
docker run -d --name risklens-mongo -p 127.0.0.1:27017:27017 \
  -v risklens-mongo:/data/db --restart unless-stopped mongo:7.0

# Backend
cd backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
cp .env.example .env     # set SECRET_KEY, and LLM_PROVIDER + its settings

# Frontend
cd ../risklens-frontend
npm ci
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start both (Ctrl+C stops them)
cd .. && scripts/dev.sh
```

The app runs on <http://localhost:3000> and the API on <http://localhost:8000>.
With Ollama, pull a model first (`ollama pull llama3.2:3b`, and `moondream` for
screenshot import).

## Deploy

### 1. Database: MongoDB Atlas
Create a free M0 cluster, a database user, and allow access from anywhere
(Network Access → `0.0.0.0/0`, since Render's IPs change). Copy the
`mongodb+srv://…` connection string.

### 2. Backend: Render
1. In Render: **New → Blueprint**, pick this repository. It reads `render.yaml`.
2. Fill in the values it asks for:
   - `MONGODB_URL`: the Atlas connection string
   - `GEMINI_API_KEY`: from Google AI Studio
   - `CORS_ORIGINS`: your frontend URL(s), comma-separated, e.g. `https://risklens.hemeshkanyal.com`
3. Deploy. `SECRET_KEY` is generated automatically. The image installs `bb` for
   identity proofs. Check `https://<service>.onrender.com/` returns
   `{"message": "RiskLens backend running"}`.

The free plan sleeps after about 15 minutes without traffic; the first request
afterwards takes up to a minute.

### 3. Frontend: Vercel
Set the project's root directory to `risklens-frontend` and add the
environment variable `NEXT_PUBLIC_API_URL=https://<service>.onrender.com`.
Pushing to `main` redeploys.

## Project layout

```
backend/            FastAPI app, auth, LLM/OCR, proof verification, Dockerfile
ai_phase1/          asset-class risk rules and rebalancing
ai_phase2/          market data, risk metrics, insights, stress tests
ai_phase3/          behavioural personalisation of explanations
zk/                 Noir identity circuit and its verification key
risklens-frontend/  Next.js app (landing page, dashboard, in-browser prover)
scripts/            dev.sh (run locally), build-circuit.sh (rebuild the circuit)
docs/               CODEBASE.md: how the code fits together
```

## Known limitations

- Identity details are self-reported; a real KYC would need a signed source
  (for example an e-passport chip) as the circuit's input.
- Explanations come from a language model and can be wrong; the computed
  figures shown alongside are the source of truth.
- Market data comes from Yahoo Finance via yfinance and can be delayed or missing.
