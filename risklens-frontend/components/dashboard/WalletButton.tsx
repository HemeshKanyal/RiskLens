"use client";

import React from "react";
import { Wallet, Unplug, AlertTriangle, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import Button from "@/components/ui/Button";

export default function WalletButton() {
    const { address, isConnecting, isConnected, isCorrectChain, connect, disconnect } = useWallet();

    if (isConnected) {
        return (
            <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-line">
                <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isCorrectChain ? "bg-positive" : "bg-warning"}`}
                    aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-fg-2 font-mono truncate">
                        {address?.slice(0, 6)}…{address?.slice(-4)}
                    </p>
                </div>
                {!isCorrectChain && (
                    <span className="text-[11px] text-warning-text inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        Use Sepolia
                    </span>
                )}
                <button
                    type="button"
                    onClick={disconnect}
                    className="p-1 rounded text-muted hover:text-fg"
                    aria-label="Disconnect wallet"
                    title="Disconnect wallet"
                >
                    <Unplug className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <Button variant="secondary" className="w-full" onClick={connect} disabled={isConnecting}>
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Wallet className="w-4 h-4" aria-hidden="true" />}
            {isConnecting ? "Connecting…" : "Connect wallet"}
        </Button>
    );
}
