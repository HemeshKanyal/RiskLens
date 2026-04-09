from web3 import Web3
import json
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("risklens.blockchain_kyc")

# ==============================
# CONFIG (loaded from .env)
# ==============================

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ACCOUNT_ADDRESS = os.getenv("ACCOUNT_ADDRESS")
KYC_CONTRACT_ADDRESS = os.getenv("KYC_CONTRACT_ADDRESS")

if not all([RPC_URL, PRIVATE_KEY, ACCOUNT_ADDRESS, KYC_CONTRACT_ADDRESS]):
    raise RuntimeError("Missing KYC blockchain config in .env — need RPC_URL, PRIVATE_KEY, ACCOUNT_ADDRESS, KYC_CONTRACT_ADDRESS")

# ABI for RiskLensZKKYC (from Remix deployment)
KYC_CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_verifier", "type": "address"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {"internalType": "bytes", "name": "proof", "type": "bytes"},
            {"internalType": "bytes32[]", "name": "publicInputs", "type": "bytes32[]"}
        ],
        "name": "verifyKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "", "type": "bytes32"}
        ],
        "name": "verifiedUsers",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "verifier",
        "outputs": [
            {"internalType": "contract HonkVerifier", "name": "", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

# ==============================
# WEB3 SETUP
# ==============================

w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 120}))
account = w3.to_checksum_address(ACCOUNT_ADDRESS)

kyc_contract = w3.eth.contract(
    address=w3.to_checksum_address(KYC_CONTRACT_ADDRESS),
    abi=KYC_CONTRACT_ABI
)

# ==============================
# HELPER: SPLIT PUBLIC INPUTS
# ==============================

def split_kyc_public_inputs(public_inputs_hex: str):
    if public_inputs_hex.startswith("0x"):
        public_inputs_hex = public_inputs_hex[2:]

    if len(public_inputs_hex) != 128:
        raise Exception(
            f"KYC PUBLIC INPUTS WRONG LENGTH: {len(public_inputs_hex)} (expected 128)"
        )

    # Each bytes32 = 64 hex chars → 2 public inputs
    chunks = [
        public_inputs_hex[i:i+64]
        for i in range(0, len(public_inputs_hex), 64)
    ]

    return ["0x" + chunk for chunk in chunks]

# ==============================
# MAIN FUNCTION
# ==============================

def submit_kyc_verification(proof: str, public_inputs: str):
    try:
        public_inputs_array = split_kyc_public_inputs(public_inputs)

        if not proof.startswith("0x"):
            proof = "0x" + proof

        logger.info("Submitting KYC verification to blockchain")
        logger.debug("KYC Public Inputs: %s", json.dumps(public_inputs_array))

        nonce = w3.eth.get_transaction_count(account)

        # Dry-run call to validate proof on-chain
        kyc_contract.functions.verifyKYC(
            proof,
            public_inputs_array
        ).call({"from": account})

        logger.info("KYC dry-run call succeeded — proof is valid")

        # Estimate gas
        gas_estimate = kyc_contract.functions.verifyKYC(
            proof,
            public_inputs_array
        ).estimate_gas({
            "from": account
        })

        logger.info("KYC estimated gas: %d", gas_estimate)

        # Build and send transaction
        tx = kyc_contract.functions.verifyKYC(
            proof,
            public_inputs_array
        ).build_transaction({
            "from": account,
            "nonce": nonce,
            "gas": gas_estimate + 500000,
            "gasPrice": w3.to_wei("10", "gwei")
        })

        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        logger.info("KYC verification tx submitted: %s", tx_hash.hex())
        return tx_hash.hex()

    except Exception as e:
        logger.error("KYC blockchain error: %s", str(e))
        raise
