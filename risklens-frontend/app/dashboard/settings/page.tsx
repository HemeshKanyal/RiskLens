"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import {
    User,
    ShieldCheck,
    Info,
} from "lucide-react";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Your account and preferences
                </p>
            </div>

            {/* Profile */}
            <Card>
                <div className="flex items-center gap-3 mb-5">
                    <User className="w-5 h-5 text-blue-400" />
                    <h2 className="text-sm font-semibold text-white">Profile</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Name</span>
                        <span className="text-sm text-white font-medium">
                            {user?.full_name || "—"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
                        <span className="text-sm text-white font-medium">
                            {user?.email || "—"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            user?.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user?.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                            {user?.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>
            </Card>

            {/* KYC Status */}
            <Card>
                <div className="flex items-center gap-3 mb-5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white">KYC Status</h2>
                </div>

                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Verification</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user?.kyc_verified
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                        {user?.kyc_verified ? "✓ Verified" : "Not Verified"}
                    </span>
                </div>
            </Card>

            {/* System Info */}
            <Card>
                <div className="flex items-center gap-3 mb-5">
                    <Info className="w-5 h-5 text-gray-400" />
                    <h2 className="text-sm font-semibold text-white">System</h2>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500">Platform</span>
                        <span className="text-xs text-gray-400">RiskLens v1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500">AI Engine</span>
                        <span className="text-xs text-gray-400">Phase 2 (Market-Driven)</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500">Blockchain</span>
                        <span className="text-xs text-gray-400">Ethereum Sepolia Testnet</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-xs text-gray-500">ZK Proofs</span>
                        <span className="text-xs text-gray-400">Noir / Barretenberg</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
