// ==============================
// RiskLens — Chain configuration
// Defaults target Sepolia; override with NEXT_PUBLIC_* env vars to point
// the app at a local Anvil chain (see README "Run locally").
// ==============================

const env = (v: string | undefined, fallback: string) => (v === undefined || v === "" ? fallback : v);

export const CHAIN = {
  id: Number(env(process.env.NEXT_PUBLIC_CHAIN_ID, "11155111")),
  name: env(process.env.NEXT_PUBLIC_CHAIN_NAME, "Sepolia testnet"),
  // Used when the wallet doesn't know the chain yet (e.g. local Anvil)
  rpcUrl: process.env.NEXT_PUBLIC_CHAIN_RPC_URL || "",
  // Empty string disables explorer links (local chains have no explorer)
  explorerTxUrl:
    process.env.NEXT_PUBLIC_EXPLORER_TX_URL !== undefined
      ? process.env.NEXT_PUBLIC_EXPLORER_TX_URL
      : "https://sepolia.etherscan.io/tx/",
  attestationContract: env(process.env.NEXT_PUBLIC_ATTESTATION_CONTRACT, "0x1ed23479aaccf270fCEaef4Ab74A07385e707608"),
  kycContract: env(process.env.NEXT_PUBLIC_KYC_CONTRACT, "0x72b3e0d8264d42b219A54D52694e26235E664E35"),
};

export function explorerTxUrl(txHash: string): string | null {
  if (!CHAIN.explorerTxUrl) return null;
  const hash = txHash.startsWith("0x") ? txHash : `0x${txHash}`;
  return `${CHAIN.explorerTxUrl}${hash}`;
}
