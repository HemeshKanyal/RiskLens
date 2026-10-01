from chain import submit_proof


def submit_kyc_verification(proof: str, public_inputs: str) -> str:
    """Record an identity attestation proof on RiskLensZKKYC."""
    return submit_proof("KYC_CONTRACT_ADDRESS", "verifyKYC", proof, public_inputs)
