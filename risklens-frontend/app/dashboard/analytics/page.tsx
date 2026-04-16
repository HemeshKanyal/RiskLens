"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getPortfolioHistory, getDecisionLogs, runBacktest } from "@/lib/api";
import type { PortfolioSnapshot, DecisionLog, BacktestResponse } from "@/lib/types";
import { formatCurrency, formatDate, getRiskColor } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, Loader2, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function AnalyticsPage() {
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
                console.error("Failed to load analytics:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Portfolio value over time (reversed so oldest first)
    const valueData = [...portfolios]
        .reverse()
        .map((p) => ({
            date: formatDate(p.created_at),
            value: p.assets.reduce((sum, a) => sum + (a.value || 0), 0),
        }));

    // Risk score over time
    const riskData = [...decisions]
        .filter((d) => d.action === "portfolio_analysis" && d.ai_analysis)
        .reverse()
        .map((d) => {
            const risk = (d.ai_analysis as Record<string, unknown>)?.risk as Record<string, unknown> | undefined;
            return {
                date: formatDate(d.created_at),
                score: (risk?.risk_score as number) || 0,
                level: (risk?.risk_level as string) || "Unknown",
            };
        });

    const hasData = portfolios.length > 0;

    function CustomTooltipChart({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-lg font-bold text-white tracking-tight">
                        {typeof payload[0].value === "number" && payload[0].value > 10
                            ? formatCurrency(payload[0].value)
                            : `${payload[0].value}/5`}
                    </p>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Analytics
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Portfolio trends and risk history
                </p>
            </div>

            {hasData && (
                <StressTestPanel latestPortfolio={portfolios[0]} />
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : hasData ? (
                <div className="grid grid-cols-1 gap-6">
                    {/* Portfolio Value Chart */}
                    {valueData.length > 1 && (
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                <h2 className="text-sm font-semibold text-white">
                                    Portfolio Value Over Time
                                </h2>
                            </div>
                            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                                <AreaChart data={valueData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.04)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: "#6B7280", fontSize: 11 }}
                                        axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#6B7280", fontSize: 11 }}
                                        axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                        tickLine={false}
                                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltipChart />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        dot={{ fill: "#0B0F19", stroke: "#3B82F6", strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    )}

                    {/* Risk Score Chart */}
                    {riskData.length > 0 && (
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <BarChart3 className="w-5 h-5 text-purple-400" />
                                <h2 className="text-sm font-semibold text-white">
                                    Risk Score History
                                </h2>
                            </div>
                            {riskData.length > 1 ? (
                                <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                                    <AreaChart data={riskData}>
                                        <defs>
                                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.04)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: "#6B7280", fontSize: 11 }}
                                            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={[0, 5]}
                                            tick={{ fill: "#6B7280", fontSize: 11 }}
                                            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltipChart />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#A855F7"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRisk)"
                                            dot={{ fill: "#0B0F19", stroke: "#A855F7", strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, fill: "#A855F7", stroke: "#fff", strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="space-y-3">
                                    {riskData.map((d, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                                        >
                                            <span className="text-sm text-gray-400">
                                                {d.date}
                                            </span>
                                            <span
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getRiskColor(d.level)}15`,
                                                    color: getRiskColor(d.level),
                                                }}
                                            >
                                                {d.level} ({d.score}/5)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                                Total Analyses
                            </p>
                            <p className="text-2xl font-semibold text-white">
                                {decisions.filter((d) => d.action === "portfolio_analysis").length}
                            </p>
                        </Card>
                        <Card>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                                On-Chain Verified
                            </p>
                            <p className="text-2xl font-semibold text-emerald-400">
                                {decisions.filter((d) => d.blockchain_status === "confirmed").length}
                            </p>
                        </Card>
                        <Card>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                                KYC Verifications
                            </p>
                            <p className="text-2xl font-semibold text-blue-400">
                                {decisions.filter((d) => d.action === "kyc_verification").length}
                            </p>
                        </Card>
                    </div>
                </div>
            ) : (
                <Card>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                            <BarChart3 className="w-7 h-7 text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-500">No analytics data yet</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Run portfolio analyses to build your analytics history
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ---------------------------------------------------------
// Stress Testing Component
// ---------------------------------------------------------

const HISTORICAL_EVENTS = [
    { id: "COVID_2020", name: "COVID-19 Crash (Mar 2020)" },
    { id: "CRYPTO_WINTER_2022", name: "Crypto Winter (2022)" },
    { id: "INFLATION_SHOCK_2021", name: "Inflation Shock (2021-2022)" },
    { id: "TECH_BUBBLE_2000", name: "Dot-Com Crash (2000)" },
];

function StressTestPanel({ latestPortfolio }: { latestPortfolio: PortfolioSnapshot }) {
    const [selectedEvent, setSelectedEvent] = useState("COVID_2020");
    const [isTesting, setIsTesting] = useState(false);
    const [result, setResult] = useState<BacktestResponse | null>(null);

    const handleRunBacktest = async () => {
        if (!latestPortfolio) return;
        setIsTesting(true);
        setResult(null);
        try {
            const data = await runBacktest({
                assets: latestPortfolio.assets,
                event_id: selectedEvent,
            });
            setResult(data);
            toast.success("Stress test completed.");
        } catch (error) {
            console.error("Backtest failed:", error);
            toast.error("Failed to run stress test.");
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <Card className="mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />

            <div className="flex items-center gap-3 mb-5">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">
                    Stress Test (Backtester)
                </h2>
            </div>

            <p className="text-sm text-gray-400 mb-5">
                See how your <strong className="text-white">current portfolio</strong> would have performed during historical crises.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="flex-1 w-full px-4 py-2.5 rounded-xl bg-[#1A2236] border border-white/[0.08] text-sm text-gray-300 outline-none hover:border-white/[0.15] cursor-pointer"
                >
                    {HISTORICAL_EVENTS.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                </select>
                <button
                    onClick={handleRunBacktest}
                    disabled={isTesting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Run Stress Test
                </button>
            </div>

            {result && (
                <div className="mt-6 p-5 rounded-2xl bg-[#1A2236] border border-red-500/10">
                    <div className="flex items-center justify-between mb-3 border-b border-white/[0.04] pb-3">
                        <h3 className="text-sm font-semibold text-white">Backtest Results</h3>
                        <span className="text-xs text-red-400 font-mono">Event: {result.event_id}</span>
                    </div>

                    {result.analysis && (result.analysis.expected_impact as number) && (
                        <div className="mb-4">
                            <span className="text-2xl font-bold text-red-400">
                                {result.analysis.expected_impact as number}%
                            </span>
                            <span className="text-xs text-gray-500 ml-2 uppercase">Estimated Drawdown</span>
                        </div>
                    )}

                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {result.llm_explanation}
                    </p>
                </div>
            )}
        </Card>
    );
}


