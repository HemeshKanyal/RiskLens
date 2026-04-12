"use client";

import React from "react";
import { useWallet } from "@/lib/wallet-context";
import { Wallet, Unplug, AlertTriangle, Loader2 } from "lucide-react";

export default function WalletButton() {
    const {
        address,
        isConnecting,
        isConnected,
        isCorrectChain,
        connect,
        disconnect,
    } = useWallet();

    if (isConnected) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            isCorrectChain ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 truncate font-mono">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                        {!isCorrectChain && (
                            <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Switch to Sepolia
                            </p>
                        )}
                    </div>
                    <button
                        onClick={disconnect}
                        className="p-1 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-red-400 transition-colors"
                        title="Disconnect wallet"
                    >
                        <Unplug className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium hover:from-orange-500/15 hover:to-amber-500/15 transition-all disabled:opacity-50"
        >
            {isConnecting ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                </>
            ) : (
                <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                </>
            )}
        </button>
    );
}
