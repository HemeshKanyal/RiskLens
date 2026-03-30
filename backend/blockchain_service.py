from web3 import Web3
import json
import os

# ==============================
# CONFIG (EDIT THESE)
# ==============================

RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/JzLs_sIi2ruO694q7uqsK"
PRIVATE_KEY = "41d3ba410a6ca9b53504aceb915acaef68f3d36201d43c00f650cf72e31ac97d"
ACCOUNT_ADDRESS = "0x623B2a013d804253101A0b1679315c677427AFd1"
CONTRACT_ADDRESS = "0x1ed23479aaccf270fCEaef4Ab74A07385e707608"

# Load ABI (make sure path is correct)
with open("../blockchain/artifacts/contracts/RiskLensZKAttestation.sol/RiskLensZKAttestation.json") as f:
    CONTRACT_JSON = json.load(f)
    CONTRACT_ABI = CONTRACT_JSON["abi"]

# ==============================
# WEB3 SETUP
# ==============================

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.to_checksum_address(ACCOUNT_ADDRESS)

contract = w3.eth.contract(
    address=w3.to_checksum_address(CONTRACT_ADDRESS),
    abi=CONTRACT_ABI
)

# ==============================
# HELPER: SPLIT PUBLIC INPUTS
# ==============================

def split_public_inputs(public_inputs_hex: str):
    if public_inputs_hex.startswith("0x"):
        public_inputs_hex = public_inputs_hex[2:]

    if len(public_inputs_hex) != 128:
        raise Exception(
            f"❌ PUBLIC INPUTS WRONG LENGTH: {len(public_inputs_hex)} (expected 128)"
        )
    # Each bytes32 = 64 hex chars
    chunks = [
        public_inputs_hex[i:i+64]
        for i in range(0, len(public_inputs_hex), 64)
    ]

    return ["0x" + chunk for chunk in chunks]

# ==============================
# MAIN FUNCTION
# ==============================

def submit_attestation(proof: str, public_inputs: str):
    try:
        public_inputs_array = split_public_inputs(public_inputs)

        if not proof.startswith("0x"):
            proof = "0x" + proof

        print("\n🚀 FINAL DATA SENT TO CONTRACT")
        print("Public Inputs (Python):", public_inputs_array)

        # Optional (just for you)
        import json
        print("Public Inputs (JSON view):", json.dumps(public_inputs_array))

        nonce = w3.eth.get_transaction_count(account)

        # 🧪 TEST FIRST (VERY IMPORTANT)
        contract.functions.attest(
            proof,
            public_inputs_array
        ).call()

        print("✅ CALL SUCCESS — Proof is valid")

        # 🔥 Step 1: Estimate gas
        gas_estimate = contract.functions.attest(
            proof,
            public_inputs_array
        ).estimate_gas({
            "from": account
        })

        print("⛽ Estimated Gas:", gas_estimate)

        # 🔥 Step 2: Build transaction using estimated gas
        tx = contract.functions.attest(
            proof,
            public_inputs_array
        ).build_transaction({
            "from": account,
            "nonce": nonce,
            "gas": gas_estimate + 500000,   # buffer
            "gasPrice": w3.to_wei("10", "gwei")
        })

        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        return tx_hash.hex()

    except Exception as e:
        print("❌ Blockchain Error:", str(e))
        raise