// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KYCVerifier.sol";

contract RiskLensZKKYC {

    HonkVerifier public verifier;

    mapping(bytes32 => bool) public verifiedUsers;

    constructor(address _verifier) {
        verifier = HonkVerifier(_verifier);
    }

    function verifyKYC(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external {

        bool valid = verifier.verify(proof, publicInputs);

        require(valid, "Invalid ZK proof");

        bytes32 identity = publicInputs[1];

        verifiedUsers[identity] = true;
    }
}