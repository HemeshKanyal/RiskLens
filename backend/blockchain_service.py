from web3 import Web3
import json
import os

RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/JzLs_sIi2ruO694q7uqsK"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

# deployed RiskLensZKAttestation address
CONTRACT_ADDRESS = "0x4d7cc54ab1674E7ED694B1B8A162Be626B269EcC"

ABI_PATH = "../blockchain/artifacts/contracts/RiskLensZKAttestation.sol/RiskLensZKAttestation.json"

with open(ABI_PATH) as f:
    contract_json = json.load(f)

ABI = contract_json["abi"]

contract = w3.eth.contract(
    address=CONTRACT_ADDRESS,
    abi=ABI
)

PRIVATE_KEY = os.getenv("PRIVATE_KEY")


def submit_attestation(snapshot_hash, proof):

    account = w3.eth.account.from_key(PRIVATE_KEY)

    # convert snapshot hash → bytes32
    snapshot_hash_bytes = Web3.to_bytes(hexstr=snapshot_hash)

    # convert proof → bytes
    proof_bytes = Web3.to_bytes(hexstr=proof)

    tx = contract.functions.attest(
        proof_bytes,
        [snapshot_hash_bytes]
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address, "pending"),
        "gas": 2000000,
        "gasPrice": w3.eth.gas_price
    })

    signed_tx = account.sign_transaction(tx)

    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

    return tx_hash.hex()

print("Connected to:", w3.is_connected())
print("Contract loaded:", contract.address)