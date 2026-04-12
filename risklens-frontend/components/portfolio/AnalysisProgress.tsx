"use client";

import React from "react";
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";

export type AnalysisStep =
    | "idle"
    | "pricing"
    | "ai_analysis"
    | "zk_proof"
    | "blockchain"
    | "done"
    | "error";

interface AnalysisProgressProps {
    currentStep: AnalysisStep;
    error?: string;
}

const STEPS = [
    {
        key: "pricing",
        label: "Fetching Live Prices",
        description: "Resolving asset values from market data",
    },
    {
        key: "ai_analysis",
        label: "Running AI Analysis",
        description: "Phase 1 rules + Phase 2 market intelligence",
    },
    {
        key: "zk_proof",
        label: "Generating ZK Proof",
        description: "Creating cryptographic proof of analysis",
    },
    {
        key: "blockchain",
        label: "Submitting to Blockchain",
        description: "Recording attestation on Sepolia testnet",
    },
] as const;

export default function AnalysisProgress({
    currentStep,
    error,
}: AnalysisProgressProps) {
    if (currentStep === "idle") return null;

    const stepOrder = STEPS.map((s) => s.key);
    const currentIndex = stepOrder.indexOf(
        currentStep as (typeof stepOrder)[number]
    );

    return (
        <div className="bg-[#1A2236]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
                {currentStep === "done" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : currentStep === "error" ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
                <h3 className="text-sm font-semibold text-white">
                    {currentStep === "done"
                        ? "Analysis Complete"
                        : currentStep === "error"
                          ? "Analysis Failed"
                          : "Analyzing Portfolio..."}
                </h3>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                        currentStep === "done"
                            ? "bg-emerald-500 w-full"
                            : currentStep === "error"
                              ? "bg-red-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }`}
                    style={{
                        width:
                            currentStep === "done"
                                ? "100%"
                                : currentStep === "error"
                                  ? `${((currentIndex + 1) / STEPS.length) * 100}%`
                                  : `${((currentIndex + 0.5) / STEPS.length) * 100}%`,
                    }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {STEPS.map((step, idx) => {
                    let status: "done" | "active" | "pending" | "error" =
                        "pending";
                    if (currentStep === "done") {
                        status = "done";
                    } else if (currentStep === "error" && idx <= currentIndex) {
                        status = idx === currentIndex ? "error" : "done";
                    } else if (idx < currentIndex) {
                        status = "done";
                    } else if (idx === currentIndex) {
                        status = "active";
                    }

                    return (
                        <div
                            key={step.key}
                            className={`flex items-center gap-3 transition-opacity ${
                                status === "pending" ? "opacity-40" : ""
                            }`}
                        >
                            {status === "done" ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : status === "active" ? (
                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                            ) : status === "error" ? (
                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            ) : (
                                <Circle className="w-4 h-4 text-gray-600 shrink-0" />
                            )}
                            <div>
                                <p
                                    className={`text-sm font-medium ${
                                        status === "done"
                                            ? "text-emerald-400"
                                            : status === "active"
                                              ? "text-white"
                                              : status === "error"
                                                ? "text-red-400"
                                                : "text-gray-500"
                                    }`}
                                >
                                    {step.label}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
}
