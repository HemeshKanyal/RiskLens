"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import AllocationChart from "@/components/dashboard/AllocationChart";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import PortfolioList from "@/components/dashboard/PortfolioList";
import { getPortfolioHistory, getDecisionLogs, exportReport } from "@/lib/api";
import type { PortfolioSnapshot, DecisionLog } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, ShieldCheck, Plus, FileText, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const [portfolios, setPortfolios] = useState<PortfolioSnapshot[]>([]);
    const [decisions, setDecisions] = useState<DecisionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [pRes, dRes] = await Promise.all([
                    getPortfolioHistory(),
                    getDecisionLogs(),
                ]);
                setPortfolios(pRes.portfolios);
                setDecisions(dRes.decisions);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Compute metrics from real data
    const latestPortfolio = portfolios[0];
    const totalValue = latestPortfolio
        ? latestPortfolio.assets.reduce((sum, a) => sum + (a.value || 0), 0)
        : 0;

    // Get latest decision with AI analysis
    const latestAnalysis = decisions.find(
        (d) => d.action === "portfolio_analysis" && d.ai_analysis
    );
    const riskScore =
        (latestAnalysis?.ai_analysis as Record<string, unknown>)?.risk as Record<string, unknown> | undefined;
    const healthScore = riskScore
        ? Math.round(((5 - (riskScore.risk_score as number)) / 5) * 100)
        : null;
    const riskLevel = riskScore?.risk_level as string | undefined;

    const hasData = portfolios.length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto space-y-6"
        >
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-[family-name:var(--font-outfit)] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasData
                            ? "Your portfolio overview and AI insights"
                            : "Get started by adding your first portfolio"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {hasData && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        toast.loading("Exporting CSV...", { id: "export-csv" });
                                        await exportReport("csv");
                                        toast.success("CSV Downloaded", { id: "export-csv" });
                                    } catch (err) {
                                        toast.error("Failed to export CSV", { id: "export-csv" });
                                    }
                                }}
                                className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-gray-300 hover:bg-white/[0.1] transition-all flex items-center gap-1.5"
                                title="Export CSV"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        toast.loading("Exporting PDF...", { id: "export-pdf" });
                                        await exportReport("pdf");
                                        toast.success("PDF Downloaded", { id: "export-pdf" });
                                    } catch (err) {
                                        toast.error("Failed to export PDF", { id: "export-pdf" });
                                    }
                                }}
                                className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-gray-300 hover:bg-white/[0.1] transition-all flex items-center gap-1.5"
                                title="Export PDF"
                            >
                                <FileText className="w-4 h-4 text-purple-400" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                        </div>
                    )}
                    <Link
                        href="/dashboard/portfolio"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 tracking-wide"
                    >
                        <Plus className="w-4 h-4" />
                        New Analysis
                    </Link>
                </div>
            </div>

            {/* Top Row: Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <MetricCard
                    label="Total Portfolio Value"
                    value={hasData ? formatCurrency(totalValue) : "—"}
                    change={
                        hasData
                            ? `${portfolios.length} snapshot${portfolios.length > 1 ? "s" : ""} recorded`
                            : "No data yet"
                    }
                    changeType="neutral"
                    isLoading={isLoading}
                    icon={<DollarSign className="w-5 h-5" />}
                />
                <MetricCard
                    label="Analyses Run"
                    value={
                        hasData
                            ? String(
                                  decisions.filter(
                                      (d) => d.action === "portfolio_analysis"
                                  ).length
                              )
                            : "0"
                    }
                    change={
                        hasData
                            ? `${decisions.filter((d) => d.blockchain_status === "confirmed").length} verified on-chain`
                            : "Run your first analysis"
                    }
                    changeType={hasData ? "positive" : "neutral"}
                    isLoading={isLoading}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
                <MetricCard
                    label="Portfolio Health Score"
                    value={
                        healthScore !== null
                            ? `${healthScore} / 100`
                            : "—"
                    }
                    change={
                        riskLevel
                            ? `Risk: ${riskLevel}`
                            : "Analyze a portfolio to see"
                    }
                    changeType={
                        riskLevel === "Low"
                            ? "positive"
                            : riskLevel === "High"
                              ? "negative"
                              : "neutral"
                    }
                    isLoading={isLoading}
                    icon={<ShieldCheck className="w-5 h-5" />}
                />
            </div>

            {/* Middle Row: Chart + AI Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AllocationChart
                    assets={latestPortfolio?.assets || []}
                    isLoading={isLoading}
                />
                <AIInsightCard
                    decision={latestAnalysis || null}
                    isLoading={isLoading}
                />
            </div>

            {/* Bottom Row: Portfolio List */}
            <PortfolioList
                portfolios={portfolios}
                isLoading={isLoading}
            />
        </motion.div>
    );
}
