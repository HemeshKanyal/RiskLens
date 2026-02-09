// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RiskLensProof {
    struct Proof {
        bytes32 userHash;
        bytes32 portfolioHash;
        uint256 anchoredAt;
        address anchoredBy;
    }

    mapping(bytes32 => Proof) private proofs;

    event ProofAnchored(
        bytes32 indexed snapshotHash,
        bytes32 indexed userHash,
        address indexed anchoredBy,
        bytes32 portfolioHash,
        uint256 anchoredAt
    );

    function anchorProof(
        bytes32 snapshotHash,
        bytes32 userHash,
        bytes32 portfolioHash
    ) external {
        require(snapshotHash != bytes32(0), "Invalid snapshot hash");
        require(proofs[snapshotHash].anchoredAt == 0, "Proof already exists");

        proofs[snapshotHash] = Proof({
            userHash: userHash,
            portfolioHash: portfolioHash,
            anchoredAt: block.timestamp,
            anchoredBy: msg.sender
        });

        emit ProofAnchored(
            snapshotHash,
            userHash,
            msg.sender,
            portfolioHash,
            block.timestamp
        );
    }

    function verifyProof(bytes32 snapshotHash)
        external
        view
        returns (
            bool exists,
            bytes32 userHash,
            bytes32 portfolioHash,
            uint256 anchoredAt,
            address anchoredBy
        )
    {
        Proof memory proof = proofs[snapshotHash];

        if (proof.anchoredAt == 0) {
            return (false, bytes32(0), bytes32(0), 0, address(0));
        }

        return (
            true,
            proof.userHash,
            proof.portfolioHash,
            proof.anchoredAt,
            proof.anchoredBy
        );
    }
}
