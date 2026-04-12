"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getDecisionAudit } from "@/lib/api";
import type { AuditResponse, AuditEntry } from "@/lib/types";
import { Loader2, Activity, Target, ShieldAlert, Cpu } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
    const [audit, setAudit] = useState<AuditResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadAudit() {
            try {
                const data = await getDecisionAudit();
                setAudit(data);
            } catch (error) {
                console.error("Failed to load audit:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadAudit();
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Behavioral Audit
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track your decision-making patterns and portfolio drift over time.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
            ) : !audit ? (
                <Card>
                    <div className="py-16 text-center">
                        <Cpu className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No behavioral data available yet.</p>
                        <p className="text-xs text-gray-600 mt-2">Interact with AI rebalancing suggestions to build your profile.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="px-5 py-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Decisions</p>
                            <p className="text-2xl font-semibold text-white">{audit.total_decisions}</p>
                        </Card>
                        <Card className="px-5 py-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Response Rate</p>
                            <p className="text-2xl font-semibold text-indigo-400">
                                {(audit.response_rate || 0).toFixed(1)}%
                            </p>
                        </Card>
                        <Card className="px-5 py-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Accept Rate</p>
                            <p className="text-2xl font-semibold text-emerald-400">
                                {(audit.accept_rate || 0).toFixed(1)}%
                            </p>
                        </Card>
                        <Card className="px-5 py-4">
                            <p className="text-xs text-amber-500/80 uppercase tracking-wider mb-1 flex items-center justify-between">
                                Panic Sell Prob. <ShieldAlert className="w-3 h-3 text-amber-500" />
                            </p>
                            <p className="text-2xl font-semibold text-amber-400">
                                {audit.volatility_patterns?.panic_sell_probability !== undefined 
                                    ? audit.volatility_patterns.panic_sell_probability.toFixed(1) + "%" 
                                    : "0.0%"}
                            </p>
                        </Card>
                    </div>

                    {/* Drifts */}
                    {audit.drifts && audit.drifts.length > 0 && (
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-5 h-5 text-rose-400" />
                                <h2 className="text-sm font-semibold text-white">
                                    Behavioral Drift Detected
                                </h2>
                            </div>
                            <ul className="space-y-2">
                                {audit.drifts.map((drift, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-300 bg-rose-500/5 border border-rose-500/10 px-4 py-2.5 rounded-lg">
                                        <span className="text-rose-400 mt-0.5">•</span> {drift}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Timeline */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-sm font-semibold text-white">
                                Decision Log
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {audit.audit_trail.map((entry: AuditEntry, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                entry.user_action === "accept" ? "bg-green-500/20 text-green-400" :
                                                entry.user_action === "reject" ? "bg-red-500/20 text-red-500" :
                                                "bg-gray-500/20 text-gray-400"
                                            }`}>
                                                {entry.user_action}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {formatDate(entry.timestamp)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400 mt-1 flex gap-4">
                                            <span>Risk at time: <strong className="text-gray-300">{entry.ai_risk_score}</strong></span>
                                            {entry.market_volatility && (
                                                <span>Volatility: {entry.market_volatility.toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 font-mono">
                                            {entry.snapshot_hash.slice(0, 8)}...
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
