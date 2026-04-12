"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import AssetForm from "@/components/portfolio/AssetForm";
import ScreenshotUploader from "@/components/portfolio/ScreenshotUploader";
import AnalysisProgress from "@/components/portfolio/AnalysisProgress";
import type { AnalysisStep } from "@/components/portfolio/AnalysisProgress";
import type { Asset, AnalysisResponse, SimulationResponse } from "@/lib/types";
import { analyzePortfolio, confirmTx, extractError, simulatePortfolio } from "@/lib/api";
import { useWallet } from "@/lib/wallet-context";
import { formatCurrency, getRiskColor, truncateHash, getEtherscanUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import {
    FileText,
    Camera,
    Link2,
    Sparkles,
    ExternalLink,
    Shield,
    BarChart3,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

type TabKey = "manual" | "screenshot" | "broker";

const TABS: { key: TabKey; label: string; icon: React.ReactNode; available: boolean }[] = [
    { key: "manual", label: "Manual Entry", icon: <FileText className="w-4 h-4" />, available: true },
    { key: "screenshot", label: "Screenshot", icon: <Camera className="w-4 h-4" />, available: true },
    { key: "broker", label: "Connect Broker", icon: <Link2 className="w-4 h-4" />, available: false },
];

export default function PortfolioPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("manual");
    const [assets, setAssets] = useState<Asset[]>([
        { symbol: "", type: "stock", quantity: null, value: null },
    ]);
    const [riskProfile, setRiskProfile] = useState<"conservative" | "balanced" | "aggressive">("balanced");
    const [lookbackDays, setLookbackDays] = useState(90);
    const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("idle");
    const [analysisError, setAnalysisError] = useState<string>("");
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
    const [showFullExplanation, setShowFullExplanation] = useState(false);

    const handleScreenshotExtracted = (extractedAssets: Asset[]) => {
        setAssets(extractedAssets);
        setActiveTab("manual"); // Switch to manual to review
    };

    const { isConnected, submitAttestation } = useWallet();

    const handleAnalyze = async () => {
        // Validate
        const validAssets = assets.filter(
            (a) => a.symbol.trim() && (a.value || a.quantity)
        );

        if (validAssets.length === 0) {
            toast.error("Add at least one asset with a symbol and quantity/value");
            return;
        }

        setAnalysisResult(null);
        setSimulationResult(null);
        setAnalysisError("");
        setAnalysisStep("pricing");

        try {
            // Simulate progress steps (backend runs them sequentially)
            const progressTimer = setTimeout(() => setAnalysisStep("ai_analysis"), 2000);
            const progressTimer2 = setTimeout(() => setAnalysisStep("zk_proof"), 6000);
            const progressTimer3 = setTimeout(() => setAnalysisStep("blockchain"), 12000);

            const result = await analyzePortfolio(
                {
                    assets: validAssets,
                    risk_profile: riskProfile,
                    lookback_days: lookbackDays,
                },
                isConnected // wallet_mode = true when wallet is connected
            );

            clearTimeout(progressTimer);
            clearTimeout(progressTimer2);
            clearTimeout(progressTimer3);

            // If wallet connected, submit from user's wallet
            if (isConnected && result.zk_proof && result.public_inputs) {
                setAnalysisStep("blockchain");
                try {
                    const txHash = await submitAttestation(result.zk_proof, result.public_inputs);
                    result.blockchain_tx = txHash;
                    result.blockchain_status = "confirmed";
                    delete result.blockchain_warning;
                    // Report TX hash back to backend
                    await confirmTx({
                        tx_hash: txHash,
                        action: "portfolio_analysis",
                        snapshot_hash: result.snapshot_hash,
                    });
                } catch (walletErr) {
                    const msg = walletErr instanceof Error ? walletErr.message : "Wallet transaction failed";
                    setAnalysisStep("error");
                    setAnalysisError(msg);
                    toast.error(msg);
                    return; // Don't show results if TX was rejected
                }
            }

            setAnalysisStep("done");
            setAnalysisResult(result);
            toast.success("Portfolio analysis complete!");
        } catch (err) {
            setAnalysisStep("error");
            const errorMsg = extractError(err);
            setAnalysisError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleSimulate = async () => {
        const validAssets = assets.filter(
            (a) => a.symbol.trim() && (a.value || a.quantity)
        );

        if (validAssets.length === 0) {
            toast.error("Add at least one asset with a symbol and quantity/value");
            return;
        }

        setAnalysisResult(null);
        setSimulationResult(null);
        setAnalysisError("");
        setAnalysisStep("ai_analysis");

        try {
            const result = await simulatePortfolio(
                {
                    assets: validAssets,
                    risk_profile: riskProfile,
                    lookback_days: lookbackDays,
                    label: "What-If Simulation",
                }
            );

            setAnalysisStep("done");
            setSimulationResult(result);
            toast.success("Simulation complete! No on-chain changes made.");
        } catch (err) {
            setAnalysisStep("error");
            const errorMsg = extractError(err);
            setAnalysisError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const activeResult = analysisResult || simulationResult;
    const risk = activeResult?.ai_analysis?.risk;
    const phase2 = activeResult?.ai_analysis?.phase2;
    const llm_explanation = activeResult?.llm_explanation;
    const isSimulated = !!simulationResult;
    const rebalancing = activeResult?.ai_analysis?.rebalancing as Record<string, unknown> | undefined;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Portfolio Analysis
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Add your assets, run AI analysis, and get blockchain-verified insights
                </p>
            </div>

            {/* Input Card */}
            <Card>
                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] rounded-xl">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => tab.available && setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.key
                                    ? "bg-white/[0.08] text-white"
                                    : tab.available
                                      ? "text-gray-500 hover:text-gray-300"
                                      : "text-gray-700 cursor-not-allowed"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {!tab.available && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-600">
                                    Soon
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "manual" && (
                    <div className="space-y-6">
                        <AssetForm assets={assets} setAssets={setAssets} />

                        {/* Settings Row */}
                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/[0.06]">
                            {/* Risk Profile */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                    Risk Profile:
                                </span>
                                <div className="flex gap-1">
                                    {(["conservative", "balanced", "aggressive"] as const).map(
                                        (profile) => (
                                            <button
                                                key={profile}
                                                onClick={() => setRiskProfile(profile)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                                                    riskProfile === profile
                                                        ? profile === "conservative"
                                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                            : profile === "balanced"
                                                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        : "bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-300"
                                                }`}
                                            >
                                                {profile}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Lookback Days */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                    Lookback:
                                </span>
                                <select
                                    value={lookbackDays}
                                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-300 outline-none appearance-none cursor-pointer"
                                >
                                    <option value={30} className="bg-[#1A2236]">30 days</option>
                                    <option value={60} className="bg-[#1A2236]">60 days</option>
                                    <option value={90} className="bg-[#1A2236]">90 days</option>
                                    <option value={180} className="bg-[#1A2236]">180 days</option>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="ml-auto flex gap-3">
                                <button
                                    onClick={handleSimulate}
                                    disabled={analysisStep !== "idle" && analysisStep !== "done" && analysisStep !== "error"}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 opacity-50" />
                                    Simulate (What-If)
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analysisStep !== "idle" && analysisStep !== "done" && analysisStep !== "error"}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Analyze Portfolio
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "screenshot" && (
                    <ScreenshotUploader onExtracted={handleScreenshotExtracted} />
                )}

                {activeTab === "broker" && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                            <Link2 className="w-9 h-9 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Broker Integration Coming Soon
                        </h3>
                        <p className="text-sm text-gray-500 max-w-md">
                            Connect your brokerage accounts to automatically import your portfolio.
                            For now, use manual entry or upload a screenshot.
                        </p>
                    </div>
                )}
            </Card>

            {/* Analysis Progress */}
            {analysisStep !== "idle" && !activeResult && (
                <AnalysisProgress currentStep={analysisStep} error={analysisError} />
            )}

            {/* Analysis Results View */}
            {activeResult && (
                <div className="space-y-5">
                    {isSimulated && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-semibold">Simulated Environment</span>
                            </div>
                            <span className="text-sm opacity-80">This is a what-if sandbox. Changes are not recorded on-chain or saved to your history.</span>
                        </div>
                    )}
                    {/* Risk Overview */}
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">
                                Risk Analysis Results
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Combined Risk Score */}
                            <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                                    Combined Risk Score
                                </p>
                                <div className="flex items-end gap-2">
                                    <span
                                        className="text-3xl font-bold"
                                        style={{ color: risk ? getRiskColor(risk.risk_level) : "#6B7280" }}
                                    >
                                        {risk?.risk_score ?? "—"}
                                    </span>
                                    <span className="text-gray-500 text-sm mb-1">/ 5</span>
                                </div>
                                {risk && (
                                    <span
                                        className="inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium"
                                        style={{
                                            backgroundColor: `${getRiskColor(risk.risk_level)}15`,
                                            color: getRiskColor(risk.risk_level),
                                        }}
                                    >
                                        {risk.risk_level} Risk
                                    </span>
                                )}
                            </div>

                            {/* Phase Scores */}
                            <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                                    Phase Breakdown
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Phase 1 (Rules) × {risk?.phase1_weight}</span>
                                            <span className="text-white font-medium">{risk?.phase1_score}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                                            <div
                                                className="h-full rounded-full bg-blue-500 transition-all"
                                                style={{ width: `${((risk?.phase1_score ?? 0) / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Phase 2 (Market) × {risk?.phase2_weight}</span>
                                            <span className="text-white font-medium">{risk?.phase2_score}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                                            <div
                                                className="h-full rounded-full bg-purple-500 transition-all"
                                                style={{ width: `${((risk?.phase2_score ?? 0) / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Blockchain Proof */}
                            {!isSimulated && analysisResult && (
                                <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                                        Blockchain Proof
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    analysisResult?.blockchain_status === "confirmed"
                                                        ? "bg-emerald-400"
                                                        : "bg-amber-400"
                                                }`}
                                            />
                                            <span className="text-sm text-white font-medium">
                                                {analysisResult?.blockchain_status === "confirmed"
                                                    ? "Verified On-Chain"
                                                    : "Pending"}
                                            </span>
                                        </div>
                                        {analysisResult.blockchain_tx && (
                                            <a
                                                href={getEtherscanUrl(analysisResult.blockchain_tx)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                                            >
                                                {truncateHash(analysisResult.blockchain_tx, 8)}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        <p className="text-xs text-gray-600 font-mono break-all">
                                            Hash: {truncateHash(analysisResult.snapshot_hash, 12)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {risk?.explanation && (
                            <p className="mt-4 text-xs text-gray-500 px-1">
                                {risk.explanation}
                            </p>
                        )}
                    </Card>

                    {/* Phase 2 Insights */}
                    {phase2?.insights && (
                        <Card>
                            <div className="flex items-center gap-3 mb-5">
                                <BarChart3 className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">
                                    AI Insights
                                </h2>
                            </div>

                            {/* Summary */}
                            {phase2.insights.summary && (
                                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                                    {phase2.insights.summary as string}
                                </p>
                            )}

                            {/* Portfolio Insights */}
                            {phase2.insights.portfolio_insights && (
                                <div className="space-y-4">
                                    <AIInsightCard 
                                        decision={isSimulated ? { 
                                            user_email: "",
                                            action: "portfolio_analysis", 
                                            ai_analysis: activeResult?.ai_analysis, 
                                            llm_explanation: activeResult?.llm_explanation,
                                            created_at: new Date().toISOString(),
                                            blockchain_status: "failed",
                                            blockchain_tx: null,
                                            snapshot_hash: "simulated_" + Date.now()
                                        } : (analysisResult ? {
                                            user_email: "",
                                            action: "portfolio_analysis",
                                            ai_analysis: analysisResult.ai_analysis,
                                            llm_explanation: analysisResult.llm_explanation,
                                            created_at: analysisResult.blockchain_tx ? "" : new Date().toISOString(),
                                            blockchain_status: analysisResult.blockchain_status,
                                            blockchain_tx: analysisResult.blockchain_tx,
                                            snapshot_hash: analysisResult.snapshot_hash
                                        } : null)} 
                                    />
                                </div>
                            )}


                        </Card>
                    )}

                    {/* LLM Explanation */}
                    {activeResult?.llm_explanation && (
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <h2 className="text-lg font-semibold text-white">
                                        AI Explanation
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowFullExplanation(!showFullExplanation)}
                                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                                >
                                    {showFullExplanation ? "Show less" : "Show full"}
                                    {showFullExplanation ? (
                                        <ChevronUp className="w-3 h-3" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                            <div
                                className={`text-sm text-gray-300 leading-relaxed whitespace-pre-wrap ${
                                    !showFullExplanation ? "line-clamp-6" : ""
                                }`}
                            >
                                {activeResult?.llm_explanation}
                            </div>
                        </Card>
                    )}

                    {/* Live Prices Used */}
                    {activeResult.live_prices_used &&
                        Object.keys(activeResult.live_prices_used).length > 0 && (
                            <Card>
                                <h3 className="text-sm font-semibold text-white mb-3">
                                    Live Prices Used
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(activeResult.live_prices_used).map(
                                        ([symbol, price]) => (
                                            <span
                                                key={symbol}
                                                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs"
                                            >
                                                <span className="text-white font-mono font-medium">
                                                    {symbol}
                                                </span>
                                                <span className="text-gray-500 ml-2">
                                                    {formatCurrency(price)}
                                                </span>
                                            </span>
                                        )
                                    )}
                                </div>
                            </Card>
                        )}

                    {/* Warnings */}
                    {!isSimulated && analysisResult?.blockchain_warning && (
                        <div className="px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <p className="text-xs text-amber-400">
                                ⚠ {analysisResult.blockchain_warning}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
