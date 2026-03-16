import subprocess
import os

def generate_zk_proof(snapshot_hash):

    zk_dir = "../zk/risklens_risk_circuit"

    try:

        subprocess.run(
            [
                "bb",
                "prove",
                "-b", "target/risklens_risk_circuit.json",
                "-w", "target/risklens_risk_circuit.gz",
                "-k", "vk/vk",
                "-o", "proof"
            ],
            cwd=zk_dir,
            check=True
        )

        proof_path = os.path.join(
            zk_dir,
            "proof/proof"
        )

        with open(proof_path) as f:
            proof = f.read().strip()

        return proof

    except Exception as e:

        print("ZK ERROR:", e)
        return None