"""
Server-side verification of identity proofs.

The proof is generated in the user's browser from their details (see
zk/risklens_kyc_circuit). The server never receives those details, only the
proof and its two public values:

    public_inputs[0]  today       YYYYMMDD date the proof was made for
    public_inputs[1]  commitment  salted hash of the details

A valid proof shows the person is 18+ on `today`, isn't from a restricted
country code, and that `commitment` is a hash of their details.
"""
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timedelta, timezone

ZK_TARGET = "noir-recursive"  # must match the browser prover's verifierTarget
VK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "zk", "risklens_kyc_circuit", "vk", "vk")
FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617
MAX_PROOF_BYTES = 64 * 1024


class InvalidProof(Exception):
    pass


def _bb_binary() -> str:
    path = os.getenv("BB_PATH") or shutil.which("bb") or os.path.expanduser("~/.bb/bb")
    if not os.path.exists(path):
        raise RuntimeError("Barretenberg (bb) not found; install it with bbup or set BB_PATH.")
    return path


def _field(hex_value: str) -> int:
    value = int(hex_value, 16)
    if not 0 <= value < FIELD_MODULUS:
        raise InvalidProof("Public input is out of range.")
    return value


def _accepted_dates() -> set[int]:
    # Allow yesterday/tomorrow so users in any time zone can prove "today"
    now = datetime.now(timezone.utc)
    return {int((now + timedelta(days=d)).strftime("%Y%m%d")) for d in (-1, 0, 1)}


def verify_kyc_proof(proof: bytes, public_inputs: list[str]) -> dict:
    """Verify an identity proof. Returns {"date": int, "commitment": "0x..."}; raises InvalidProof."""
    if not proof or len(proof) > MAX_PROOF_BYTES:
        raise InvalidProof("Proof is missing or too large.")
    if len(public_inputs) != 2:
        raise InvalidProof("Expected two public inputs.")

    today, commitment = (_field(v) for v in public_inputs)
    if today not in _accepted_dates():
        raise InvalidProof("Proof isn't for today's date. Generate a new one.")

    with tempfile.TemporaryDirectory(prefix="kyc_verify_") as tmp:
        proof_path = os.path.join(tmp, "proof")
        inputs_path = os.path.join(tmp, "public_inputs")
        with open(proof_path, "wb") as f:
            f.write(proof)
        with open(inputs_path, "wb") as f:
            f.write(b"".join(_field(v).to_bytes(32, "big") for v in public_inputs))

        result = subprocess.run(
            [_bb_binary(), "verify", "-k", VK_PATH, "-p", proof_path, "-i", inputs_path, "-t", ZK_TARGET],
            capture_output=True,
            timeout=60,
        )
    if result.returncode != 0:
        raise InvalidProof("Proof did not verify.")

    return {"date": today, "commitment": "0x" + commitment.to_bytes(32, "big").hex()}
