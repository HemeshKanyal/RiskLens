#!/usr/bin/env bash
# Start a local Anvil chain for RiskLens (chain id 31337).
# State is kept in blockchain/.anvil-state.json so deployed contracts survive restarts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANVIL="${ANVIL:-$HOME/.foundry/bin/anvil}"

exec "$ANVIL" \
  --host 127.0.0.1 --port 8545 \
  --chain-id 31337 \
  --code-size-limit 200000 \
  --gas-limit 100000000 \
  --state "$ROOT/blockchain/.anvil-state.json" \
  --state-interval 5
