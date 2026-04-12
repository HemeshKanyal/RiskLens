"use client";

import React from "react";
import Card from "@/components/ui/Card";
import type { DecisionLog } from "@/lib/types";
import { formatRelativeTime, getRiskColor } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { submitFeedback } from "@/lib/api";
import { useState } from "react";

interface AIInsightCardProps {
    decision: DecisionLog | null;
    isLoading?: boolean;
}

export default function AIInsightCard({
    decision,
    isLoading = false,
}: AIInsightCardProps) {
    const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const aiAnalysis = decision?.ai_analysis as Record<string, unknown> | undefined;
    const risk = aiAnalysis?.risk as Record<string, unknown> | undefined;
    const riskScore = risk?.risk_score as number | undefined;
    const riskLevel = risk?.risk_level as string | undefined;
    const phase2 = aiAnalysis?.phase2 as Record<string, unknown> | undefined;
    const insights = phase2?.insights as Record<string, unknown> | undefined;
    const summary = insights?.summary as string | undefined;
    const portfolioInsights = insights?.portfolio_insights as Array<{ category?: string; severity?: string; message?: string } | string> | undefined;
    const llmExplanation = decision?.llm_explanation;

    // Get a short recommendation from LLM or insights
    const recommendation =
        llmExplanation && llmExplanation.length > 20
            ? llmExplanation.slice(0, 300) + (llmExplanation.length > 300 ? "..." : "")
            : summary || "Analyze a portfolio to receive AI-powered insights and recommendations.";

    const rebalancing = aiAnalysis?.rebalancing as { suggestions?: string[] } | undefined;
    const suggestions = rebalancing?.suggestions || [];

    const handleFeedback = async (action: "accept" | "reject" | "modify" | "ignore") => {
        if (!decision?.snapshot_hash) return;
        setIsSubmitting(true);
        try {
            await submitFeedback({
                snapshot_hash: decision.snapshot_hash,
                action
            });
            setFeedbackStatus(action);
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            setFeedbackStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const riskProgress = riskScore !== undefined ? (riskScore / 5) * 100 : 0;
    const riskColor = riskLevel ? getRiskColor(riskLevel) : "#6B7280";

    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    {/* AI Pulse Icon */}
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-lg bg-purple-500/20 animate-pulse" />
                        <Sparkles className="w-4 h-4 text-purple-400 relative z-10" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                        AI Insights
                    </h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                    Phase 2
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4 flex-1">
                    <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-6 w-40 rounded bg-white/[0.04] animate-pulse" />
                    <div className="space-y-2 mt-4">
                        <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
                        <div className="h-3 w-3/4 rounded bg-white/[0.04] animate-pulse" />
                        <div className="h-3 w-5/6 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                </div>
            ) : decision ? (
                <>
                    {/* Risk Level */}
                    <div className="mb-5">
                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                            Risk Level
                        </p>
                        <div className="flex items-center gap-3">
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                                style={{
                                    backgroundColor: `${riskColor}15`,
                                    borderColor: `${riskColor}30`,
                                    color: riskColor,
                                    borderWidth: "1px",
                                }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: riskColor }}
                                />
                                {riskLevel || "Unknown"}
                                {riskScore !== undefined && (
                                    <span className="text-xs opacity-70 ml-1">
                                        ({riskScore}/5)
                                    </span>
                                )}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${riskProgress}%`,
                                        backgroundColor: riskColor,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Key Insights */}
                    {portfolioInsights && portfolioInsights.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                                Key Insights
                            </p>
                            <ul className="space-y-1.5">
                                {portfolioInsights.slice(0, 3).map((insight, i) => {
                                    const msg = typeof insight === "string" ? insight : insight?.message ?? "";
                                    return (
                                        <li
                                            key={i}
                                            className="text-xs text-gray-400 flex items-start gap-2"
                                        >
                                            <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                            <span className="line-clamp-2">{msg}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Recommendation */}
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                            AI Recommendation
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 mb-4">
                            {recommendation}
                        </p>

                        {/* Rebalancing & Feedback */}
                        {suggestions.length > 0 && (
                            <div className="mt-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <p className="text-xs text-indigo-300 font-medium mb-2 uppercase tracking-wider">
                                    Suggested Actions
                                </p>
                                <ul className="space-y-1.5 mb-3">
                                    {suggestions.map((sug, i) => (
                                        <li key={i} className="text-xs text-indigo-200">
                                            • {sug}
                                        </li>
                                    ))}
                                </ul>

                                {feedbackStatus && feedbackStatus !== "error" ? (
                                    <p className="text-xs text-green-400 font-medium">
                                        ✓ Feedback saved. AI will learn from this.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <button
                                            onClick={() => handleFeedback("accept")}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold rounded-lg transition-colors border border-green-500/30"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleFeedback("reject")}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors border border-red-500/30"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleFeedback("modify")}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-xs font-semibold rounded-lg transition-colors border border-yellow-500/30"
                                        >
                                            Modify
                                        </button>
                                        <button
                                            onClick={() => handleFeedback("ignore")}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-semibold rounded-lg transition-colors border border-white/10"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                            {decision.created_at
                                ? formatRelativeTime(decision.created_at)
                                : ""}
                        </p>
                        <Link
                            href="/dashboard/portfolio"
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                        >
                            New Analysis →
                        </Link>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-7 h-7 text-purple-500/50" />
                    </div>
                    <p className="text-sm text-gray-500">No insights yet</p>
                    <p className="text-xs text-gray-600 mt-1 max-w-[200px]">
                        Run a portfolio analysis to get AI-powered risk insights
                    </p>
                    <Link
                        href="/dashboard/portfolio"
                        className="mt-4 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium hover:bg-purple-500/20 transition-all"
                    >
                        Analyze Portfolio →
                    </Link>
                </div>
            )}
        </Card>
    );
}
