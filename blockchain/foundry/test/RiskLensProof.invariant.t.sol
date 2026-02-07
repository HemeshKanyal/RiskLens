// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "contracts/RiskLensProof.sol";

contract RiskLensInvariant is Test {
    RiskLensProof riskLens;

    function setUp() public {
        riskLens = new RiskLensProof();
    }

    /// INVARIANT: once anchored, snapshot cannot be overwritten
    function invariant_NoOverwrite() public {
    bytes32 h = keccak256("proof");

    (bool exists,,,,) = riskLens.verifyProof(h);

    if (exists) {
        vm.expectRevert();
        riskLens.anchorProof(h, keccak256("u"), keccak256("p"));
    }
}


    /// INVARIANT: anchored proof stays anchored forever
    function invariant_AnchoredIsStable() public {
    bytes32 h = keccak256("proof");

    (bool exists1, bytes32 u1, bytes32 p1, uint256 t1, ) =
        riskLens.verifyProof(h);

    (bool exists2, bytes32 u2, bytes32 p2, uint256 t2, ) =
        riskLens.verifyProof(h);

    // existence cannot change
    assertEq(exists1, exists2);

    // if anchored, data must never mutate
    if (exists1) {
        assertEq(u1, u2);
        assertEq(p1, p2);
        assertEq(t1, t2);
    }
}


}
