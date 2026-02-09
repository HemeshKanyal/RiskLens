// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

import "./RiskLensRiskVerifier.sol";

contract RiskLensZKAttestation {
    struct Attestation {
        bytes32 claimHash;
        address prover;
        uint64 attestedAt;
    }

    // snapshotHash => attestation
    mapping(bytes32 => Attestation) public attestations;

    // Honk ZK verifier
    HonkVerifier public immutable verifier;

    event Attested(
        bytes32 indexed snapshotHash,
        bytes32 claimHash,
        address indexed prover
    );

    constructor(address _verifier) {
        require(_verifier != address(0), "Invalid verifier");
        verifier = HonkVerifier(_verifier);
    }

    function attest(
        bytes32 snapshotHash,
        bytes32 claimHash,
        bytes calldata proof
    ) external {
        require(
            attestations[snapshotHash].attestedAt == 0,
            "Already attested"
        );

        // ✅ DECLARE AND ALLOCATE public inputs (THIS WAS MISSING)
        bytes32[] memory publicInputs = new bytes32[](2);

        publicInputs[0] = snapshotHash;
        publicInputs[1] = claimHash;
        // remaining inputs are zero-padded automatically

        bool ok = verifier.verify(proof, publicInputs);
        require(ok, "Invalid ZK proof");

        attestations[snapshotHash] = Attestation({
            claimHash: claimHash,
            prover: msg.sender,
            attestedAt: uint64(block.timestamp)
        });

        emit Attested(snapshotHash, claimHash, msg.sender);
    }
}