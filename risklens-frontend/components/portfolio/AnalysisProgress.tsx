"use client";

import React from "react";
import { CheckCircle, Circle, Loader2, XCircle, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        description: "Computing Noir cryptographic circuit on-device",
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
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 space-y-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative"
        >
            {/* Background animated pulse if ZK proofing */}
            {currentStep === "zk_proof" && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 -z-10"
                />
            )}

            <div className="flex items-center gap-3 mb-2">
                {currentStep === "done" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="w-6 h-6 text-emerald-400" /></motion.div>
                ) : currentStep === "error" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><XCircle className="w-6 h-6 text-red-400" /></motion.div>
                ) : currentStep === "zk_proof" ? (
                    <Code2 className="w-6 h-6 text-emerald-400 animate-pulse" />
                ) : (
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                )}
                <h3 className="text-sm font-semibold text-white tracking-tight">
                    {currentStep === "done"
                        ? "Analysis & Attestation Complete"
                        : currentStep === "error"
                          ? "Analysis Failed"
                          : currentStep === "zk_proof"
                            ? "Computing Cryptographic ZK Proof..."
                            : "Analyzing Portfolio..."}
                </h3>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden relative">
                <motion.div
                    className={`absolute left-0 top-0 h-full rounded-full ${
                        currentStep === "done"
                            ? "bg-emerald-500"
                            : currentStep === "error"
                              ? "bg-red-500"
                              : currentStep === "zk_proof"
                                ? "bg-gradient-to-r from-emerald-400 to-cyan-500"
                                : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }`}
                    initial={{ width: "0%" }}
                    animate={{
                        width: currentStep === "done"
                            ? "100%"
                            : currentStep === "error"
                              ? `${((currentIndex + 1) / STEPS.length) * 100}%`
                              : `${((currentIndex + 0.5) / STEPS.length) * 100}%`
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-4 pt-2">
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

                    const isActive = status === "active";

                    return (
                        <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: status === "pending" ? 0.4 : 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4 relative"
                        >
                            {/* Connecting Line */}
                            {idx !== STEPS.length - 1 && (
                                <div className={`absolute left-2.5 top-6 w-[2px] h-6 -translate-x-1/2 ${status === "done" ? "bg-emerald-500/50" : "bg-white/[0.06]"}`} />
                            )}
                            
                            <div className="mt-0.5 relative z-10 bg-[#111] rounded-full">
                                {status === "done" ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : status === "active" ? (
                                    step.key === "zk_proof" ? (
                                        <Code2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                    )
                                ) : status === "error" ? (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-600" />
                                )}
                            </div>
                            
                            <div>
                                <p
                                    className={`text-sm font-semibold tracking-wide ${
                                        status === "done"
                                            ? "text-emerald-400"
                                            : status === "active"
                                              ? step.key === "zk_proof" ? "text-emerald-300" : "text-white"
                                              : status === "error"
                                                ? "text-red-400"
                                                : "text-gray-500"
                                    }`}
                                >
                                    {step.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${isActive ? "text-gray-300" : "text-gray-600"}`}>
                                    {isActive && step.key === "zk_proof" ? (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="font-mono text-[10px] text-emerald-400/80 mr-2"
                                        >
                                            [0x{Math.random().toString(16).slice(2, 8)}]
                                        </motion.span>
                                    ) : null}
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                        <p className="text-xs text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
