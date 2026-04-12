"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getDecisionLogs } from "@/lib/api";
import type { DecisionLog } from "@/lib/types";
import { formatDate, formatRelativeTime, truncateHash, getEtherscanUrl, getRiskColor } from "@/lib/utils";
import {
    History,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    BarChart3,
    Loader2,
} from "lucide-react";

export default function HistoryPage() {
    const [decisions, setDecisions] = useState<DecisionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getDecisionLogs();
                setDecisions(data.decisions);
            } catch (error) {
                console.error("Failed to load decisions:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const toggleExpand = (idx: number) => {
        setExpandedId(expandedId === idx ? null : idx);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Decision History
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Timeline of all AI analyses and KYC verifications
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : decisions.length > 0 ? (
                <div className="space-y-3">
                    {decisions.map((decision, idx) => {
                        const isExpanded = expandedId === idx;
                        const isAnalysis = decision.action === "portfolio_analysis";
                        const aiAnalysis = decision.ai_analysis as Record<string, unknown> | undefined;
                        const risk = aiAnalysis?.risk as Record<string, unknown> | undefined;

                        return (
                            <Card key={idx}>
                                <button
                                    onClick={() => toggleExpand(idx)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                isAnalysis
                                                    ? "bg-blue-500/10"
                                                    : "bg-emerald-500/10"
                                            }`}
                                        >
                                            {isAnalysis ? (
                                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                            ) : (
                                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {isAnalysis
                                                    ? "Portfolio Analysis"
                                                    : "KYC Verification"}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(decision.created_at)}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {formatRelativeTime(decision.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Risk Badge */}
                                        {risk && (
                                            <span
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getRiskColor(risk.risk_level as string)}15`,
                                                    color: getRiskColor(risk.risk_level as string),
                                                }}
                                            >
                                                {risk.risk_level as string} ({risk.risk_score as number}/5)
                                            </span>
                                        )}

                                        {/* Blockchain status */}
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                decision.blockchain_status === "confirmed"
                                                    ? "bg-emerald-400"
                                                    : "bg-amber-400"
                                            }`}
                                        />

                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        )}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-3">
                                        {/* Hashes */}
                                        {decision.snapshot_hash && (
                                            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                                                <span className="text-xs text-gray-500">
                                                    Snapshot Hash
                                                </span>
                                                <span className="text-xs text-white font-mono">
                                                    {truncateHash(decision.snapshot_hash, 12)}
                                                </span>
                                            </div>
                                        )}
                                        {decision.claim_hash && (
                                            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                                                <span className="text-xs text-gray-500">
                                                    Claim Hash
                                                </span>
                                                <span className="text-xs text-white font-mono">
                                                    {truncateHash(decision.claim_hash, 12)}
                                                </span>
                                            </div>
                                        )}
                                        {decision.identity_commitment_hash && (
                                            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                                                <span className="text-xs text-gray-500">
                                                    Identity Hash
                                                </span>
                                                <span className="text-xs text-white font-mono">
                                                    {truncateHash(decision.identity_commitment_hash, 12)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Blockchain TX */}
                                        <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                                            <span className="text-xs text-gray-500">
                                                Blockchain TX
                                            </span>
                                            {decision.blockchain_tx ? (
                                                <a
                                                    href={getEtherscanUrl(decision.blockchain_tx)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                                                >
                                                    {truncateHash(decision.blockchain_tx, 8)}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-600">
                                                    No transaction
                                                </span>
                                            )}
                                        </div>

                                        {/* LLM Explanation */}
                                        {decision.llm_explanation && (
                                            <div className="px-3 py-3 rounded-lg bg-white/[0.02]">
                                                <p className="text-xs text-gray-500 mb-2 font-medium">
                                                    AI Explanation
                                                </p>
                                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-6 whitespace-pre-wrap">
                                                    {decision.llm_explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                            <History className="w-7 h-7 text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-500">No history yet</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Your analysis and KYC history will appear here
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
