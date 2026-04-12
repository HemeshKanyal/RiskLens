"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import AllocationChart from "@/components/dashboard/AllocationChart";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import PortfolioList from "@/components/dashboard/PortfolioList";
import { getPortfolioHistory, getDecisionLogs } from "@/lib/api";
import type { PortfolioSnapshot, DecisionLog } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, ShieldCheck, Plus } from "lucide-react";
import Link from "next/link";

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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasData
                            ? "Your portfolio overview and AI insights"
                            : "Get started by adding your first portfolio"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/portfolio"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
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
        </div>
    );
}
