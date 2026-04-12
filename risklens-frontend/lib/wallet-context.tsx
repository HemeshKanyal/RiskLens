"use client";

// ==============================
// RiskLens — Wallet Context Provider
// MetaMask / Ethereum wallet integration
// ==============================

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { BrowserProvider, JsonRpcSigner, Contract } from "ethers";
import toast from "react-hot-toast";

// Contract ABIs (minimal — only the functions we call)
const ATTESTATION_ABI = [
    "function attest(bytes calldata proof, bytes32[] calldata publicInputs) external",
];

const KYC_ABI = [
    "function verifyKYC(bytes calldata proof, bytes32[] calldata publicInputs) external",
];

// Contract addresses (Sepolia)
const ATTESTATION_CONTRACT = "0x1ed23479aaccf270fCEaef4Ab74A07385e707608";
const KYC_CONTRACT = "0x72b3e0d8264d42b219A54D52694e26235E664E35";

interface WalletContextValue {
    address: string | null;
    isConnecting: boolean;
    isConnected: boolean;
    chainId: number | null;
    isCorrectChain: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    submitAttestation: (proof: string, publicInputs: string) => Promise<string>;
    submitKYC: (proof: string, publicInputs: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const SEPOLIA_CHAIN_ID = 11155111;

function splitPublicInputs(hex: string): string[] {
    let cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
    // Pad to 128 chars if needed
    while (cleaned.length < 128) cleaned = "0" + cleaned;
    const chunks: string[] = [];
    for (let i = 0; i < cleaned.length; i += 64) {
        chunks.push("0x" + cleaned.slice(i, i + 64));
    }
    return chunks;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const isConnected = !!address;
    const isCorrectChain = chainId === SEPOLIA_CHAIN_ID;

    // Listen for account/chain changes
    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const handleAccountsChanged = (...args: unknown[]) => {
            const accounts = args[0] as string[];
            if (accounts.length === 0) {
                setAddress(null);
            } else {
                setAddress(accounts[0]);
            }
        };

        const handleChainChanged = (...args: unknown[]) => {
            const chainIdHex = args[0] as string;
            setChainId(parseInt(chainIdHex, 16));
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        // Check if already connected
        window.ethereum
            .request({ method: "eth_accounts" })
            .then((result: unknown) => {
                const accounts = result as string[];
                if (accounts.length > 0) {
                    setAddress(accounts[0]);
                    window.ethereum!
                        .request({ method: "eth_chainId" })
                        .then((id: unknown) => setChainId(parseInt(id as string, 16)));
                }
            })
            .catch(() => {});

        return () => {
            window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum!.removeListener("chainChanged", handleChainChanged);
        };
    }, []);

    const connect = useCallback(async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            toast.error("MetaMask not detected! Please install MetaMask.");
            window.open("https://metamask.io/download/", "_blank");
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = (await window.ethereum.request({
                method: "eth_requestAccounts",
            })) as string[];
            setAddress(accounts[0]);

            const chainIdHex = (await window.ethereum.request({
                method: "eth_chainId",
            })) as string;
            const chain = parseInt(chainIdHex, 16);
            setChainId(chain);

            if (chain !== SEPOLIA_CHAIN_ID) {
                // Try to switch to Sepolia
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0xaa36a7" }], // Sepolia
                    });
                    setChainId(SEPOLIA_CHAIN_ID);
                } catch {
                    toast.error("Please switch to Sepolia testnet in MetaMask");
                }
            }

            toast.success("Wallet connected!");
        } catch (err) {
            console.error("Wallet connection failed:", err);
            toast.error("Failed to connect wallet");
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
        setChainId(null);
        toast.success("Wallet disconnected");
    }, []);

    const getSigner = useCallback(async (): Promise<JsonRpcSigner> => {
        if (!window.ethereum) throw new Error("MetaMask not installed");
        const provider = new BrowserProvider(window.ethereum);
        return provider.getSigner();
    }, []);

    const submitAttestation = useCallback(
        async (proof: string, publicInputs: string): Promise<string> => {
            if (!isConnected) throw new Error("Wallet not connected");
            if (!isCorrectChain) throw new Error("Switch to Sepolia testnet");

            const signer = await getSigner();
            const contract = new Contract(ATTESTATION_CONTRACT, ATTESTATION_ABI, signer);

            const proofBytes = proof.startsWith("0x") ? proof : "0x" + proof;
            const inputsArray = splitPublicInputs(publicInputs);

            toast.loading("Confirm transaction in MetaMask...", { id: "tx" });

            try {
                const tx = await contract.attest(proofBytes, inputsArray);
                toast.loading("Transaction submitted, waiting for confirmation...", { id: "tx" });
                const receipt = await tx.wait();
                toast.success("Transaction confirmed on-chain!", { id: "tx" });
                return receipt.hash;
            } catch (err: unknown) {
                toast.dismiss("tx");
                if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ACTION_REJECTED") {
                    throw new Error("Transaction rejected by user");
                }
                throw err;
            }
        },
        [isConnected, isCorrectChain, getSigner]
    );

    const submitKYC = useCallback(
        async (proof: string, publicInputs: string): Promise<string> => {
            if (!isConnected) throw new Error("Wallet not connected");
            if (!isCorrectChain) throw new Error("Switch to Sepolia testnet");

            const signer = await getSigner();
            const contract = new Contract(KYC_CONTRACT, KYC_ABI, signer);

            const proofBytes = proof.startsWith("0x") ? proof : "0x" + proof;
            const inputsArray = splitPublicInputs(publicInputs);

            toast.loading("Confirm KYC transaction in MetaMask...", { id: "tx" });

            try {
                const tx = await contract.verifyKYC(proofBytes, inputsArray);
                toast.loading("KYC transaction submitted, waiting...", { id: "tx" });
                const receipt = await tx.wait();
                toast.success("KYC verified on-chain!", { id: "tx" });
                return receipt.hash;
            } catch (err: unknown) {
                toast.dismiss("tx");
                if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ACTION_REJECTED") {
                    throw new Error("Transaction rejected by user");
                }
                throw err;
            }
        },
        [isConnected, isCorrectChain, getSigner]
    );

    return (
        <WalletContext.Provider
            value={{
                address,
                isConnecting,
                isConnected,
                chainId,
                isCorrectChain,
                connect,
                disconnect,
                submitAttestation,
                submitKYC,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet(): WalletContextValue {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}

// Type declaration for window.ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}
