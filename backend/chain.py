"""
Shared, lazily-initialised client for submitting ZK proofs on-chain.

On-chain anchoring is optional: if RPC_URL / PRIVATE_KEY / the contract
address aren't set, submit_proof raises ChainNotConfigured and callers save
the analysis without a transaction instead of the whole app failing to start.
"""
import os
import logging
from functools import lru_cache

from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

logger = logging.getLogger("risklens.chain")

# Only the functions we call; avoids depending on Hardhat build artifacts.
_PROOF_FN_INPUTS = [
    {"internalType": "bytes", "name": "proof", "type": "bytes"},
    {"internalType": "bytes32[]", "name": "publicInputs", "type": "bytes32[]"},
]


def _abi(fn_name: str):
    return [{
        "inputs": _PROOF_FN_INPUTS,
        "name": fn_name,
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }]


class ChainNotConfigured(Exception):
    pass


@lru_cache(maxsize=1)
def _web3():
    rpc_url = os.getenv("RPC_URL")
    if not rpc_url or not os.getenv("PRIVATE_KEY"):
        raise ChainNotConfigured("RPC_URL and PRIVATE_KEY are not set; on-chain anchoring is disabled.")
    return Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 120}))


def is_configured(address_env: str) -> bool:
    return bool(os.getenv("RPC_URL") and os.getenv("PRIVATE_KEY") and os.getenv(address_env))


def split_public_inputs(public_inputs_hex: str, count: int = 2):
    """Split concatenated public inputs into `count` bytes32 values."""
    hex_str = public_inputs_hex[2:] if public_inputs_hex.startswith("0x") else public_inputs_hex
    if len(hex_str) != 64 * count:
        raise ValueError(f"Public inputs have length {len(hex_str)}, expected {64 * count}")
    return ["0x" + hex_str[i:i + 64] for i in range(0, len(hex_str), 64)]


def submit_proof(address_env: str, fn_name: str, proof: str, public_inputs: str) -> str:
    """Verify-then-send `fn_name(proof, publicInputs)` on the contract at $address_env. Returns the tx hash."""
    address = os.getenv(address_env)
    if not address:
        raise ChainNotConfigured(f"{address_env} is not set; on-chain anchoring is disabled.")

    w3 = _web3()
    private_key = os.getenv("PRIVATE_KEY")
    account = w3.eth.account.from_key(private_key).address
    contract = w3.eth.contract(address=w3.to_checksum_address(address), abi=_abi(fn_name))

    inputs = split_public_inputs(public_inputs)
    proof_hex = proof if proof.startswith("0x") else "0x" + proof
    call = getattr(contract.functions, fn_name)(proof_hex, inputs)

    # Dry run first so an invalid proof fails here rather than as a reverted tx
    call.call({"from": account})
    gas = call.estimate_gas({"from": account})

    tx = call.build_transaction({
        "from": account,
        "nonce": w3.eth.get_transaction_count(account),
        "gas": gas + 100_000,
        "gasPrice": w3.eth.gas_price,
        "chainId": w3.eth.chain_id,
    })
    signed = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    logger.info("%s tx submitted: %s", fn_name, tx_hash.hex())
    return tx_hash.hex()
