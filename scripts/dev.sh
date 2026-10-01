#!/usr/bin/env bash
# Run RiskLens locally: Anvil chain, FastAPI backend (:8000), Next.js frontend (:3000).
# MongoDB (docker) and Ollama run as system services and are only checked here.
# Ctrl+C stops everything this script started.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.nargo/bin:$HOME/.bb:$HOME/.foundry/bin:$PATH"

check() { # name command
  if eval "$2" >/dev/null 2>&1; then echo "  ✓ $1"; else echo "  ✗ $1 — $3"; fi
}
echo "Checking services:"
check "MongoDB on :27017" "(exec 3<>/dev/tcp/127.0.0.1/27017)" "start it: docker start risklens-mongo"
check "Ollama on :11434" "curl -sf http://127.0.0.1:11434/api/tags" "start it: sudo systemctl start ollama (explanations will be skipped)"
check "nargo + bb" "command -v nargo && command -v bb" "install them (proofs will be skipped)"

# Stop everything this script started (whole process group) on exit / Ctrl+C
trap 'trap - EXIT INT TERM; echo; echo "Stopping..."; kill 0 2>/dev/null' EXIT INT TERM

rpc() { curl -sf -XPOST -H 'content-type: application/json' --data "$1" http://127.0.0.1:8545; }

if ! rpc '{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}' >/dev/null; then
  echo "Starting Anvil on :8545"
  "$ROOT/scripts/local-chain.sh" > "$ROOT/blockchain/.anvil.log" 2>&1 &
  for _ in $(seq 1 20); do rpc '{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}' >/dev/null && break; sleep 0.5; done
fi

# Deploy contracts if the addresses in backend/.env have no code on this chain
ADDR=$(grep -E '^CONTRACT_ADDRESS=' "$ROOT/backend/.env" | cut -d= -f2 || true)
CODE=$(rpc "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getCode\",\"params\":[\"${ADDR:-0x0000000000000000000000000000000000000000}\",\"latest\"]}" | grep -o '"result":"[^"]*"' || true)
if [ -z "$ADDR" ] || [ "$CODE" = '"result":"0x"' ]; then
  echo "Contracts not found on the local chain; deploying..."
  "$ROOT/scripts/deploy-local.sh"
else
  echo "  ✓ Contracts deployed at $ADDR"
fi

echo "Starting backend on http://localhost:8000"
(cd "$ROOT/backend" && exec ./.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000 --reload) &

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
echo "Starting frontend on http://localhost:$FRONTEND_PORT"
(cd "$ROOT/risklens-frontend" && exec npm run dev -- --port "$FRONTEND_PORT") &

wait
