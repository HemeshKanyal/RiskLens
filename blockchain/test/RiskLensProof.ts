import hre from "hardhat";
import { expect } from "chai";


describe("RiskLensProof", function () {
  let contract: any;
  let ethers: any;

  beforeEach(async () => {
    const connection = await (hre.network as any).connect();
    ethers = connection.ethers;

    const RiskLensProof = await ethers.getContractFactory("RiskLensProof");
    contract = await RiskLensProof.deploy();
    await contract.waitForDeployment();
  });

  it("anchors a proof correctly", async () => {
    const snapshot = ethers.id("snapshot1");
    const user = ethers.id("user1");
    const portfolio = ethers.id("portfolio1");

    await contract.anchorProof(snapshot, user, portfolio);

    const result = await contract.verifyProof(snapshot);

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(user);
    expect(result[2]).to.equal(portfolio);
  });

  it("prevents duplicate snapshots", async () => {
    const snapshot = ethers.id("dup");

    await contract.anchorProof(snapshot, ethers.id("u"), ethers.id("p"));

    await expect(
      contract.anchorProof(snapshot, ethers.id("u2"), ethers.id("p2"))
    ).to.be.revertedWith("Proof already exists");
  });

  it("rejects zero snapshot hash", async () => {
    await expect(
      contract.anchorProof(
        ethers.ZeroHash,
        ethers.id("u"),
        ethers.id("p")
      )
    ).to.be.revertedWith("Invalid snapshot hash");
  });
});
