import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();

    console.log("Deploying with account:", deployer.address);

    // 1. Deploy ZKTranscriptLib
    const ZKTranscriptLibFactory = await ethers.getContractFactory("ZKTranscriptLib");
    const zkTranscriptLib = await ZKTranscriptLibFactory.deploy();
    await zkTranscriptLib.waitForDeployment();

    const zkTranscriptLibAddress = await zkTranscriptLib.getAddress();
    console.log("ZKTranscriptLib deployed to:", zkTranscriptLibAddress);

    // 2. Deploy HonkVerifier with linked library
    const HonkVerifierFactory = await ethers.getContractFactory(
        "HonkVerifier",
        {
            libraries: {
                ZKTranscriptLib: zkTranscriptLibAddress,
            },
        }
    );

    const verifier = await HonkVerifierFactory.deploy({
        gasLimit: 15_000_000, // force gas, skip estimation
    });
    await verifier.waitForDeployment();

    const verifierAddress = await verifier.getAddress();
    console.log("HonkVerifier deployed to:", verifierAddress);

    // 3. Deploy ZK Attestation (depends on verifier)
    const Attestation = await ethers.getContractFactory("RiskLensZKAttestation");
    const attestation = await Attestation.deploy(verifierAddress, {
        gasLimit: 3_000_000,
    });

    await attestation.waitForDeployment();

    console.log(
        "RiskLensZKAttestation deployed to:",
        await attestation.getAddress()
    );

    // 4. Deploy Snapshot Anchor
    const Proof = await ethers.getContractFactory("RiskLensProof");
    const proof = await Proof.deploy();
    await proof.waitForDeployment();

    console.log("RiskLensProof deployed to:", await proof.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
