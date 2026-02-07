// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "contracts/RiskLensProof.sol";

contract RiskLensProofTest is Test {
    RiskLensProof proof;

    function setUp() public {
        proof = new RiskLensProof();
    }

        function testFuzz_AnchorProof(
        bytes32 snapshot,
        bytes32 user,
        bytes32 portfolio
    ) public {
        vm.assume(snapshot != bytes32(0));

        proof.anchorProof(snapshot, user, portfolio);

        (bool exists, bytes32 u, bytes32 p, uint256 ts, address issuer) =
            proof.verifyProof(snapshot);

        assertTrue(exists);
        assertEq(u, user);
        assertEq(p, portfolio);
        assertGt(ts, 0);
    }

        function testFuzz_NoDuplicateAnchors(
        bytes32 snapshot,
        bytes32 user1,
        bytes32 user2
    ) public {
        vm.assume(snapshot != bytes32(0));

        proof.anchorProof(snapshot, user1, bytes32("p"));

        vm.expectRevert("Proof already exists");
        proof.anchorProof(snapshot, user2, bytes32("p2"));
    }

        function testFuzz_ZeroSnapshotReverts(
        bytes32 user,
        bytes32 portfolio
    ) public {
        vm.expectRevert("Invalid snapshot hash");
        proof.anchorProof(bytes32(0), user, portfolio);
    }
}
