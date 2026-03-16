// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs)
        external
        view
        returns (bool);
}

contract RiskLensZKAttestation {

    IVerifier public verifier;

    struct Attestation {
        address user;
        bytes32 snapshotHash;
        bytes32 claimHash;
        uint256 timestamp;
    }

    mapping(address => Attestation) public attestations;

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    function attest(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external {

        require(publicInputs.length == 2, "Invalid public inputs");

        bool valid = verifier.verify(proof, publicInputs);
        require(valid, "Invalid proof");

        attestations[msg.sender] = Attestation({
            user: msg.sender,
            snapshotHash: publicInputs[0],
            claimHash: publicInputs[1],
            timestamp: block.timestamp
        });
    }
}