"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import { verifyKYC, confirmTx, extractError } from "@/lib/api";
import { useWallet } from "@/lib/wallet-context";
import type { KYCResponse } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { truncateHash, getEtherscanUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import {
    ShieldCheck,
    Loader2,
    CheckCircle,
    ExternalLink,
    AlertTriangle,
} from "lucide-react";

export default function KYCPage() {
    const { user } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [age, setAge] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<KYCResponse | null>(null);

    const { isConnected, submitKYC } = useWallet();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !dateOfBirth || !countryCode || !documentId.trim() || !age) {
            toast.error("Please fill all fields");
            return;
        }

        const ageNum = parseInt(age);
        const countryNum = parseInt(countryCode);

        if (ageNum < 18) {
            toast.error("You must be at least 18 years old");
            return;
        }

        if ([1, 2, 3].includes(countryNum)) {
            toast.error("This country code is restricted");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const data = await verifyKYC(
                {
                    full_name: fullName.trim(),
                    date_of_birth: dateOfBirth,
                    country_code: countryNum,
                    document_id: documentId.trim(),
                    age: ageNum,
                },
                isConnected // wallet_mode
            );

            // If wallet connected, submit from user's wallet
            if (isConnected && data.zk_proof && data.public_inputs) {
                try {
                    const txHash = await submitKYC(data.zk_proof, data.public_inputs);
                    data.blockchain_tx = txHash;
                    data.blockchain_status = "confirmed";
                    data.status = "KYC verified on-chain (your wallet)";
                    delete data.blockchain_warning;
                    await confirmTx({
                        tx_hash: txHash,
                        action: "kyc_verification",
                    });
                } catch (walletErr) {
                    const msg = walletErr instanceof Error ? walletErr.message : "Wallet transaction failed";
                    data.blockchain_warning = msg;
                    data.blockchain_status = "failed";
                }
            }

            setResult(data);
            toast.success("KYC verification complete!");
        } catch (err) {
            toast.error(extractError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    KYC Verification
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Verify your identity with zero-knowledge proofs — your data stays private
                </p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm text-blue-300 font-medium">
                        Privacy-First KYC
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Your personal data is hashed locally and only a cryptographic commitment is stored on-chain.
                        No raw personal data leaves your device.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full legal name"
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white outline-none focus:border-blue-500/50 transition-all disabled:opacity-50 [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Country Code
                            </label>
                            <input
                                type="number"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                placeholder="e.g., 91 for India"
                                min="4"
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                Age
                            </label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Must be 18+"
                                min="18"
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                            Document ID (Passport / National ID)
                        </label>
                        <input
                            type="text"
                            value={documentId}
                            onChange={(e) => setDocumentId(e.target.value)}
                            placeholder="Your document number"
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating ZK proof & verifying...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                Verify Identity
                            </>
                        )}
                    </button>
                </form>
            </Card>

            {/* Result */}
            {result && (
                <Card>
                    <div className="flex items-center gap-3 mb-5">
                        {result.blockchain_status === "confirmed" ? (
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                {result.status}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-xs text-gray-500">Identity Hash</span>
                            <span className="text-xs text-white font-mono">
                                {truncateHash(result.identity_commitment_hash, 12)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-xs text-gray-500">Blockchain Status</span>
                            <span
                                className={`text-xs font-medium ${
                                    result.blockchain_status === "confirmed"
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                }`}
                            >
                                {result.blockchain_status === "confirmed"
                                    ? "✓ Confirmed"
                                    : "⏳ Pending"}
                            </span>
                        </div>
                        {result.blockchain_tx && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-xs text-gray-500">Transaction</span>
                                <a
                                    href={getEtherscanUrl(result.blockchain_tx)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                                >
                                    {truncateHash(result.blockchain_tx, 8)}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </div>

                    {result.blockchain_warning && (
                        <div className="mt-4 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <p className="text-xs text-amber-400">
                                ⚠ {result.blockchain_warning}
                            </p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
