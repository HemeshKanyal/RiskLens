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
import { BrowserProvider, Contract, parseEther, toQuantity } from "ethers";
import toast from "react-hot-toast";
import { CHAIN } from "./chain";

// Contract ABIs (minimal — only the functions we call)
const ATTESTATION_ABI = [
    "function attest(bytes calldata proof, bytes32[] calldata publicInputs) external",
];

const KYC_ABI = [
    "function verifyKYC(bytes calldata proof, bytes32[] calldata publicInputs) external",
];

const ATTESTATION_CONTRACT = CHAIN.attestationContract;
const KYC_CONTRACT = CHAIN.kycContract;

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

const TARGET_CHAIN_ID = CHAIN.id;
const LOCAL_CHAIN_ID = 31337;

/**
 * Local Anvil chain only: give the connected wallet test ETH so it can pay
 * fees. Uses Anvil's dev-only anvil_setBalance; does nothing on real networks.
 */
async function fundOnLocalChain(address: string) {
    if (CHAIN.id !== LOCAL_CHAIN_ID || !CHAIN.rpcUrl) return;
    const rpc = (method: string, params: unknown[]) =>
        fetch(CHAIN.rpcUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        }).then((r) => r.json());
    try {
        const { result } = await rpc("eth_getBalance", [address, "latest"]);
        if (BigInt(result ?? "0x0") >= parseEther("1")) return;
        await rpc("anvil_setBalance", [address, toQuantity(parseEther("100"))]);
        toast.success("Added 100 test ETH to your wallet (local chain only)");
    } catch {
        // Chain not reachable; the fee check will explain if a transaction can't be paid
    }
}

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
    const isCorrectChain = chainId === TARGET_CHAIN_ID;

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

    useEffect(() => {
        if (address && chainId === LOCAL_CHAIN_ID) fundOnLocalChain(address);
    }, [address, chainId]);

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

            if (chain !== TARGET_CHAIN_ID) {
                const chainIdHex = `0x${TARGET_CHAIN_ID.toString(16)}`;
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: chainIdHex }],
                    });
                    setChainId(TARGET_CHAIN_ID);
                } catch {
                    // Unknown to the wallet (e.g. a local chain): offer to add it
                    try {
                        if (!CHAIN.rpcUrl) throw new Error("no rpc url");
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: chainIdHex,
                                chainName: CHAIN.name,
                                rpcUrls: [CHAIN.rpcUrl],
                                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                            }],
                        });
                        setChainId(TARGET_CHAIN_ID);
                    } catch {
                        toast.error(`Switch your wallet to ${CHAIN.name}`);
                    }
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

    // Send a proof to one of our contracts, checking first that the wallet
    // can pay the fee so the user gets a clear message instead of a wallet alert.
    const sendProofTx = useCallback(
        async (
            contractAddress: string,
            abi: string[],
            fn: "attest" | "verifyKYC",
            proof: string,
            publicInputs: string
        ): Promise<string> => {
            if (!isConnected) throw new Error("Wallet not connected");
            if (!isCorrectChain) throw new Error(`Switch your wallet to ${CHAIN.name}`);

            const provider = new BrowserProvider(window.ethereum!);
            const signer = await provider.getSigner();
            const contract = new Contract(contractAddress, abi, signer);
            const args = [proof.startsWith("0x") ? proof : "0x" + proof, splitPublicInputs(publicInputs)];

            const [gas, fees, balance] = await Promise.all([
                contract[fn].estimateGas(...args),
                provider.getFeeData(),
                provider.getBalance(await signer.getAddress()),
            ]);
            const pricePerGas = fees.maxFeePerGas ?? fees.gasPrice ?? BigInt(0);
            if (balance < gas * pricePerGas) {
                throw new Error(
                    `Not enough ETH on ${CHAIN.name} to pay the network fee` +
                        (CHAIN.id === LOCAL_CHAIN_ID ? ". Reconnect your wallet to get local test ETH." : ".")
                );
            }

            toast.loading("Confirm the transaction in your wallet…", { id: "tx" });
            try {
                const tx = await contract[fn](...args);
                toast.loading("Waiting for confirmation…", { id: "tx" });
                const receipt = await tx.wait();
                toast.success("Recorded on-chain", { id: "tx" });
                return receipt.hash;
            } catch (err: unknown) {
                toast.dismiss("tx");
                if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ACTION_REJECTED") {
                    throw new Error("You rejected the transaction in your wallet");
                }
                throw err;
            }
        },
        [isConnected, isCorrectChain]
    );

    const submitAttestation = useCallback(
        (proof: string, publicInputs: string) =>
            sendProofTx(ATTESTATION_CONTRACT, ATTESTATION_ABI, "attest", proof, publicInputs),
        [sendProofTx]
    );

    const submitKYC = useCallback(
        (proof: string, publicInputs: string) => sendProofTx(KYC_CONTRACT, KYC_ABI, "verifyKYC", proof, publicInputs),
        [sendProofTx]
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
