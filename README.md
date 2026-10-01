# RiskLens

Portfolio risk and diversification analysis. Enter your holdings and RiskLens
measures volatility, concentration and correlation, then explains the result in
plain language with a local language model. An optional identity check uses a
zero-knowledge proof generated in your browser, so your details never leave
your device.

> Educational tool, not investment advice.

## How it fits together

| Part | Where | What it does |
|---|---|---|
| Frontend | `risklens-frontend/` | Next.js app (dashboard, analysis, history, stress tests, identity check) |
| API | `backend/` | FastAPI: auth, analysis pipeline, persistence, proof verification |
| Risk engine | `ai_phase1/`, `ai_phase2/` | Asset-class scoring and market metrics from daily prices (Yahoo Finance) |
| Behaviour | `ai_phase3/` | Learns from accept/decline feedback to tailor explanations (never the score) |
| Identity circuit | `zk/risklens_kyc_circuit/` | Noir circuit: 18+, country not restricted, salted commitment |
| Database | MongoDB | Users, snapshots, decision logs |
| Explanations / OCR | Ollama | Local LLM summary; screenshot import |

The risk score (0–5) is 40% asset-class mix and 60% measured portfolio
volatility. The language model only writes the explanation from those figures.

### Identity check

1. The browser hashes the name and document number, adds a random salt and
   runs the circuit with `noir_js`, then proves it with `bb.js` (UltraHonk).
2. Only the proof and its public values are sent: today's date and a salted
   commitment to the details.
3. The backend verifies the proof with the `bb` CLI against
   `zk/risklens_kyc_circuit/vk/vk`, checks the date is current, and stores the
   commitment. Names, birth dates and document numbers are never sent or stored.

It's a demo of the technique, not a regulated KYC: details are self-reported.

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
- Barretenberg `bb` (verifies identity proofs), as a pair with Noir:
  ```bash
  noirup -v 1.0.0-beta.22 && bbup   # bb 5.0.0-nightly.20260522
  ```

### Setup (one time)

```bash
# Backend
cd backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
cp .env.example .env          # then set SECRET_KEY (see the comment in the file)

# Frontend
cd ../risklens-frontend
npm ci
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### Start

```bash
scripts/dev.sh
```

Checks MongoDB, Ollama and `bb`, then runs the API on <http://localhost:8000>
and the app on <http://localhost:3000>. Ctrl+C stops both. Without Ollama,
analyses still work but have no written explanation.

### Changing the identity circuit

Edit `zk/risklens_kyc_circuit/src/main.nr`, then run `scripts/build-circuit.sh`.
It runs the circuit tests, copies the compiled circuit to
`risklens-frontend/public/circuits/` (used by the browser) and regenerates the
verification key (used by the backend). Commit both. The `bb.js` and
`noir_js` versions in `risklens-frontend/package.json` must match the CLI
versions above.

## Known limitations

- Identity details are self-reported; a real KYC would need a signed source
  (for example an e-passport chip) as the circuit's input.
- Explanations come from a small local model and can still be wrong; the UI
  labels them and the computed figures are the source of truth.
