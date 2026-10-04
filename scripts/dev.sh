#!/usr/bin/env bash
# Run RiskLens locally: FastAPI backend (:8000) and Next.js frontend (:3000).
# MongoDB (docker) and Ollama run as system services and are only checked here.
# Ctrl+C stops everything this script started.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.bb:$PATH"

check() { # name command hint
  if eval "$2" >/dev/null 2>&1; then echo "  ✓ $1"; else echo "  ✗ $1 — $3"; fi
}
echo "Checking services:"
check "MongoDB on :27017" "(exec 3<>/dev/tcp/127.0.0.1/27017)" "start it: docker start risklens-mongo"
if grep -q "^LLM_PROVIDER=gemini" "$ROOT/backend/.env" 2>/dev/null; then
  echo "  ✓ Language model: Gemini (from backend/.env)"
else
  check "Ollama on :11434" "curl -sf http://127.0.0.1:11434/api/tags" "start it: sudo systemctl start ollama (explanations will be skipped)"
fi
check "bb (proof verifier)" "command -v bb" "install with bbup (identity checks will fail)"

# Stop everything this script started (whole process group) on exit / Ctrl+C
trap 'trap - EXIT INT TERM; echo; echo "Stopping..."; kill 0 2>/dev/null' EXIT INT TERM

echo "Starting backend on http://localhost:8000"
(cd "$ROOT/backend" && exec ./.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000 --reload) &

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
echo "Starting frontend on http://localhost:$FRONTEND_PORT"
(cd "$ROOT/risklens-frontend" && exec npm run dev -- --port "$FRONTEND_PORT") &

wait
