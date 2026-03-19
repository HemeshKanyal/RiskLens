import os

def generate_zk_proof(snapshot_hash):

    base_dir = os.path.dirname(os.path.abspath(__file__))

    zk_dir = os.path.join(base_dir, "..", "zk", "risklens_risk_circuit")

    proof_path = os.path.join(zk_dir, "proof", "proof")

    with open(proof_path, "rb") as f:
        proof = f.read()

    return proof.hex()