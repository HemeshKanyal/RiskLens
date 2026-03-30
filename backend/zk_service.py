import subprocess
import os

FIELD_MODULUS = 2**254


def generate_zk_proof(snapshot_hash, claim_hash):

    # ✅ Correct absolute path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    zk_dir = os.path.join(base_dir, "..", "zk", "risklens_risk_circuit")

    # ✅ Convert hashes → field-safe integers
    snapshot_int = int(snapshot_hash, 16) % FIELD_MODULUS
    claim_int = int(claim_hash, 16) % FIELD_MODULUS

    print("Snapshot int:", snapshot_int)
    print("Claim int:", claim_int)

    # ✅ Update Prover.toml
    prover_path = os.path.join(zk_dir, "Prover.toml")

    with open(prover_path, "w") as f:
        f.write(f"""
snapshot_hash = "{snapshot_int}"
claim_hash = "{claim_int}"

balances = ["10","20","30"]
prices = ["2","3","4"]

threshold = "90"
""")

    # 🔍 Debug: confirm file written
    print("\n=== Prover.toml ===")
    with open(prover_path) as f:
        print(f.read())

    # ✅ Ensure vk exists
    vk_path = os.path.join(zk_dir, "vk", "vk")
    if not os.path.exists(vk_path):
        raise Exception("❌ VK not found. Run `bb write_vk` first.")

    # ✅ Step 1 — execute circuit
    subprocess.run(["nargo", "execute"], cwd=zk_dir, check=True)

    # ✅ Step 2 — generate proof (FIXED COMMAND)
    subprocess.run([
        "bb", "prove",
        "-b", "target/risklens_risk_circuit.json",
        "-w", "target/risklens_risk_circuit.gz",
        "-k", "vk/vk",          # ✅ CRITICAL FIX
        "-o", "proof",
        "-t", "evm"
    ], cwd=zk_dir, check=True)

    # ✅ Step 3 — read proof
    proof_path = os.path.join(zk_dir, "proof", "proof")
    with open(proof_path, "rb") as f:
        proof = f.read().hex()

    # ✅ Step 4 — read public inputs (MOST IMPORTANT)
    public_inputs_path = os.path.join(zk_dir, "proof", "public_inputs")
    with open(public_inputs_path, "rb") as f:
        public_inputs = f.read().hex()

    print("\n=== PUBLIC INPUTS ===")
    print(public_inputs)

    return proof, public_inputs