import subprocess
import os
import hashlib

# Exact BN254 scalar field modulus used by Noir/Barretenberg
FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617


def generate_kyc_proof(full_name: str, date_of_birth: str, country_code: int, document_id: str, age: int):
    """
    Generate a ZK proof for KYC verification.
    
    - Computes identity_commitment from user's private data (name + dob + doc_id)
    - Writes dynamic Prover.toml
    - Runs nargo execute + bb prove
    - Returns (proof_hex, public_inputs_hex, identity_commitment_hex)
    """

    # ✅ Absolute path to KYC circuit
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zk_dir = os.path.join(base_dir, "..", "zk", "risklens_kyc_circuit")

    # ✅ Compute identity commitment from user's private KYC data
    # This is the core hash that makes each user unique
    identity_string = f"{full_name}|{date_of_birth}|{document_id}"
    identity_hash = hashlib.sha256(identity_string.encode()).hexdigest()
    identity_commitment = int(identity_hash, 16) % FIELD_MODULUS

    # Both public inputs are the same commitment hash
    # (claim_hash binds the claim, identity_commitment_hash is the public anchor)
    claim_hash = identity_commitment
    identity_commitment_hash = identity_commitment

    print(f"\n🔐 KYC Identity String: {identity_string}")
    print(f"🔐 Identity Commitment (int): {identity_commitment}")

    # ✅ Write dynamic Prover.toml
    prover_path = os.path.join(zk_dir, "Prover.toml")

    with open(prover_path, "w") as f:
        f.write(f'age = "{age}"\n')
        f.write(f'country_code = "{country_code}"\n')
        f.write(f'kyc_status = "1"\n')
        f.write(f'identity_commitment = "{identity_commitment}"\n')
        f.write(f'\n')
        f.write(f'claim_hash = "{claim_hash}"\n')
        f.write(f'identity_commitment_hash = "{identity_commitment_hash}"\n')

    # 🔍 Debug: confirm file written
    print("\n=== KYC Prover.toml ===")
    with open(prover_path) as f:
        print(f.read())

    # ✅ Ensure vk exists
    vk_path = os.path.join(zk_dir, "vk", "vk")
    if not os.path.exists(vk_path):
        raise Exception("❌ KYC VK not found. Run `bb write_vk` first.")

    # ✅ Step 1 — execute circuit (solves witness)
    print("⏳ Running nargo execute for KYC circuit...")
    subprocess.run(["nargo", "execute"], cwd=zk_dir, check=True)

    # ✅ Step 2 — generate proof
    print("⏳ Generating KYC ZK proof...")
    subprocess.run([
        "bb", "prove",
        "-b", "target/risklens_kyc_circuit.json",
        "-w", "target/risklens_kyc_circuit.gz",
        "-k", "vk/vk",
        "-o", "proof",
        "-t", "evm"
    ], cwd=zk_dir, check=True)

    # ✅ Step 3 — read proof
    proof_path = os.path.join(zk_dir, "proof", "proof")
    with open(proof_path, "rb") as f:
        proof = f.read().hex()

    # ✅ Step 4 — read public inputs
    public_inputs_path = os.path.join(zk_dir, "proof", "public_inputs")
    with open(public_inputs_path, "rb") as f:
        public_inputs = f.read().hex()

    print("\n=== KYC PUBLIC INPUTS ===")
    print(public_inputs)

    return proof, public_inputs, identity_hash
