# RiskLens

Portfolio risk and diversification analysis. Enter your holdings and RiskLens
measures volatility, concentration and correlation, explains the result in
plain language with a local language model, and anchors a hash of each
analysis on-chain with a zero-knowledge proof.

> Educational tool, not investment advice.

## How it fits together

| Part | Where | What it does |
|---|---|---|
| Frontend | `risklens-frontend/` | Next.js app (dashboard, analysis, history, stress tests) |
| API | `backend/` | FastAPI: auth, analysis pipeline, persistence, proofs, chain |
| Risk engine | `ai_phase1/`, `ai_phase2/` | Asset-class scoring and market metrics from daily prices (Yahoo Finance) |
| Behaviour | `ai_phase3/` | Learns from accept/reject feedback to tailor explanations (never the score) |
| ZK circuits | `zk/` | Noir circuits for snapshot attestation and identity attestation |
| Contracts | `blockchain/contracts/` | Verifier-backed attestation contracts |
| Database | MongoDB | Users, snapshots, decision logs |
| Explanations / OCR | Ollama | Local LLM summary; screenshot import |

The risk score (0–5) is 40% asset-class mix and 60% measured portfolio
volatility. The language model only writes the explanation from those figures.

## Run locally

### Prerequisites (one time)

- Node.js 20+ and Python 3.12+
- Docker, for MongoDB. MongoDB 8 can't start on Linux kernel 6.19+
  ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)), so use 7.0:
  ```bash
  docker run -d --name risklens-mongo -p 127.0.0.1:27017:27017 \
    -v risklens-mongo:/data/db --restart unless-stopped mongo:7.0
  ```
- [Ollama](https://ollama.com) with a model that fits your GPU:
  ```bash
  ollama pull llama3.2:3b   # explanations (use llama3.1:8b with ≥8 GB VRAM)
  ollama pull moondream     # screenshot import
  ```
- Noir toolchain, as a matched pair:
  ```bash
  noirup -v 1.0.0-beta.22 && bbup
  ```
- [Foundry](https://getfoundry.sh) (`anvil`, `forge`), installed in `~/.foundry/bin`

### Setup (one time)

```bash
# Backend
cd backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
cp .env.example .env          # then set SECRET_KEY (see the comment in the file)

# Frontend
cd ../risklens-frontend
npm ci
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CHAIN_NAME=Local Anvil chain
NEXT_PUBLIC_CHAIN_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_EXPLORER_TX_URL=
EOF
```

### Start

```bash
scripts/dev.sh
```

This checks MongoDB, Ollama and the Noir toolchain, starts a local Anvil chain
(state kept in `blockchain/.anvil-state.json`), deploys the contracts if they
aren't on the chain yet (writing their addresses into both env files), then
runs the API on <http://localhost:8000> and the app on <http://localhost:3000>.
Ctrl+C stops everything.

Anything missing is skipped rather than fatal: without Ollama there's no
written explanation, and without the Noir toolchain or chain the analysis is
saved but not anchored.

### Useful scripts

| Script | Purpose |
|---|---|
| `scripts/dev.sh` | Run everything locally |
| `scripts/local-chain.sh` | Run only the Anvil chain |
| `scripts/deploy-local.sh` | Redeploy contracts; `REGENERATE=1` also rebuilds circuits, keys and Solidity verifiers |

The local chain uses Anvil's public test account. Never reuse that key anywhere else.

## Known limitations

- The snapshot-attestation circuit proves knowledge of the snapshot and claim
  hashes; its risk inputs are placeholders, so it doesn't prove anything about
  the risk score itself.
- Identity attestation is self-reported (no document check) and is not a
  regulated KYC.
- Explanations come from a small local model and can still be wrong; the UI
  labels them and the computed figures are the source of truth.
