#!/usr/bin/env bash
# Rebuild the identity circuit after editing zk/risklens_kyc_circuit/src/main.nr.
#   - runs the circuit tests
#   - compiles it and copies the artifact to the frontend (proved in the browser)
#   - writes the verification key the backend checks proofs against
# Requires nargo 1.0.0-beta.22 and bb 5.0.0-nightly.20260522 (noirup / bbup).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.nargo/bin:$HOME/.bb:$PATH"
CIRCUIT="$ROOT/zk/risklens_kyc_circuit"

cd "$CIRCUIT"
nargo test
nargo compile
mkdir -p "$ROOT/risklens-frontend/public/circuits"
cp target/risklens_kyc_circuit.json "$ROOT/risklens-frontend/public/circuits/risklens_kyc_circuit.json"
rm -rf vk && bb write_vk -b target/risklens_kyc_circuit.json -o vk -t noir-recursive
echo "Circuit artifact and verification key updated. Commit both."
