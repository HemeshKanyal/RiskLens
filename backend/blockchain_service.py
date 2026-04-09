from web3 import Web3
import json
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("risklens.blockchain")

# ==============================
# CONFIG (loaded from .env)
# ==============================

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ACCOUNT_ADDRESS = os.getenv("ACCOUNT_ADDRESS")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

if not all([RPC_URL, PRIVATE_KEY, ACCOUNT_ADDRESS, CONTRACT_ADDRESS]):
    raise RuntimeError("Missing blockchain config in .env — need RPC_URL, PRIVATE_KEY, ACCOUNT_ADDRESS, CONTRACT_ADDRESS")

# Load ABI (make sure path is correct)
abi_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "blockchain", "artifacts", "contracts", "RiskLensZKAttestation.sol", "RiskLensZKAttestation.json")
with open(abi_path) as f:
    CONTRACT_JSON = json.load(f)
    CONTRACT_ABI = CONTRACT_JSON["abi"]

# ==============================
# WEB3 SETUP
# ==============================

w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 120}))
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
            f"PUBLIC INPUTS WRONG LENGTH: {len(public_inputs_hex)} (expected 128)"
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

        logger.info("Submitting attestation to blockchain")
        logger.debug("Public Inputs: %s", json.dumps(public_inputs_array))

        nonce = w3.eth.get_transaction_count(account)

        # Dry-run call to validate proof before sending tx
        contract.functions.attest(
            proof,
            public_inputs_array
        ).call()

        logger.info("Dry-run call succeeded — proof is valid")

        # Estimate gas
        gas_estimate = contract.functions.attest(
            proof,
            public_inputs_array
        ).estimate_gas({
            "from": account
        })

        logger.info("Estimated gas: %d", gas_estimate)

        # Build and send transaction
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

        logger.info("Attestation tx submitted: %s", tx_hash.hex())
        return tx_hash.hex()

    except Exception as e:
        logger.error("Blockchain attestation error: %s", str(e))
        raise