from chain import submit_proof


def submit_attestation(proof: str, public_inputs: str) -> str:
    """Anchor a portfolio snapshot proof on RiskLensZKAttestation."""
    return submit_proof("CONTRACT_ADDRESS", "attest", proof, public_inputs)
