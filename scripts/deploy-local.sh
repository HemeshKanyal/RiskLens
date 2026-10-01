#!/usr/bin/env bash
# Build and deploy the ZK verifiers + RiskLens contracts to the local Anvil
# chain, then write the addresses into backend/.env and risklens-frontend/.env.local.
#
# Each verifier is built in its own throwaway Foundry project because bb
# generates identically named libraries/contracts for every circuit.
#
# Prereqs: scripts/local-chain.sh running; nargo + bb on PATH (to regenerate
# verifiers, run with REGENERATE=1).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FORGE="${FORGE:-$HOME/.foundry/bin/forge}"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
# Anvil's default account #0. Public test key: never use it on a real network.
DEPLOYER_KEY="${DEPLOYER_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
BUILD="$ROOT/blockchain/.local-build"

if [ "${REGENERATE:-0}" = "1" ]; then
  for c in risklens_risk_circuit risklens_kyc_circuit; do
    (cd "$ROOT/zk/$c" && nargo compile && bb write_vk -b "target/$c.json" -o vk -t evm)
  done
  bb write_solidity_verifier -k "$ROOT/zk/risklens_risk_circuit/vk/vk" -o "$ROOT/zk/risklens_risk_circuit/HonkVerifier.sol" -t evm
  bb write_solidity_verifier -k "$ROOT/zk/risklens_kyc_circuit/vk/vk" -o "$ROOT/zk/risklens_kyc_circuit/KYCVerifier.sol" -t evm
  cp "$ROOT/zk/risklens_kyc_circuit/KYCVerifier.sol" "$ROOT/blockchain/contracts/KYCVerifier.sol"
fi

# deploy <name> <verifier.sol> <verifier file name in src> <wrapper contract>
deploy() {
  local name=$1 verifier_src=$2 verifier_file=$3 wrapper=$4
  local dir="$BUILD/$name"
  rm -rf "$dir" && mkdir -p "$dir/src" "$dir/script"
  cp "$verifier_src" "$dir/src/$verifier_file"
  cp "$ROOT/blockchain/contracts/$wrapper.sol" "$dir/src/$wrapper.sol"
  cat > "$dir/foundry.toml" <<TOML
[profile.default]
src = "src"
out = "out"
libs = ["$ROOT/blockchain/foundry/lib"]
solc_version = "0.8.27"
optimizer = true
optimizer_runs = 1
remappings = ["forge-std/=$ROOT/blockchain/foundry/lib/forge-std/src/"]
TOML
  cat > "$dir/script/Deploy.s.sol" <<SOL
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "forge-std/Script.sol";
import {HonkVerifier} from "../src/$verifier_file";
import {$wrapper} from "../src/$wrapper.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        HonkVerifier verifier = new HonkVerifier();
        $wrapper app = new $wrapper(address(verifier));
        vm.stopBroadcast();
        console.log("VERIFIER", address(verifier));
        console.log("APP", address(app));
    }
}
SOL
  (cd "$dir" && "$FORGE" script script/Deploy.s.sol --rpc-url "$RPC_URL" --private-key "$DEPLOYER_KEY" \
      --broadcast --skip-simulation --slow) > "$dir/deploy.log" 2>&1 || { cat "$dir/deploy.log" >&2; exit 1; }
  grep -oE "APP 0x[0-9a-fA-F]{40}" "$dir/deploy.log" | awk '{print $2}'
}

set_env() { # file key value
  if grep -q "^$2=" "$1"; then sed -i "s|^$2=.*|$2=$3|" "$1"; else echo "$2=$3" >> "$1"; fi
}

echo "Deploying attestation contracts..."
ATTESTATION=$(deploy attestation "$ROOT/zk/risklens_risk_circuit/HonkVerifier.sol" HonkVerifier.sol RiskLensZKAttestation)
echo "  RiskLensZKAttestation: $ATTESTATION"
echo "Deploying identity contracts..."
KYC=$(deploy kyc "$ROOT/zk/risklens_kyc_circuit/KYCVerifier.sol" KYCVerifier.sol RiskLensZKKYC)
echo "  RiskLensZKKYC:         $KYC"

BACKEND_ENV="$ROOT/backend/.env"
FRONTEND_ENV="$ROOT/risklens-frontend/.env.local"
set_env "$BACKEND_ENV" RPC_URL "$RPC_URL"
set_env "$BACKEND_ENV" PRIVATE_KEY "$DEPLOYER_KEY"
set_env "$BACKEND_ENV" CONTRACT_ADDRESS "$ATTESTATION"
set_env "$BACKEND_ENV" KYC_CONTRACT_ADDRESS "$KYC"
set_env "$FRONTEND_ENV" NEXT_PUBLIC_ATTESTATION_CONTRACT "$ATTESTATION"
set_env "$FRONTEND_ENV" NEXT_PUBLIC_KYC_CONTRACT "$KYC"
echo "Wrote addresses to backend/.env and risklens-frontend/.env.local"
