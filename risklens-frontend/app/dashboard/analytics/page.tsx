"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LineChart as LineChartIcon } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { APP_CHAPTERS } from "@/lib/chapters";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Button, { buttonStyles } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import TrendChart from "@/components/analysis/TrendChart";
import { snapshotValue } from "@/components/dashboard/RecentSnapshots";
import { getPortfolioHistory, getDecisionLogs, runBacktest, extractError } from "@/lib/api";
import { RISK_THRESHOLDS } from "@/lib/analysis";
import type { PortfolioSnapshot, DecisionLog, BacktestResponse } from "@/lib/types";
import { formatCompactCurrency, formatCurrency, formatDate, formatPercent, parseServerDate } from "@/lib/utils";

// Must match STRESS_EVENTS in ai_phase2/backtest_engine.py
const STRESS_EVENTS = [
    { id: "COVID_2020", name: "COVID-19 crash", period: "Feb–May 2020" },
    { id: "CRYPTO_WINTER_2022", name: "Rate hikes & crypto winter", period: "2022" },
    { id: "BANKING_CRISIS_2008", name: "Global financial crisis", period: "Sep 2008–Mar 2009" },
];

interface BacktestAnalysis {
    event_name?: string;
    period?: string;
    context?: string;
    error?: string;
    portfolio_metrics?: { max_drawdown_pct?: number | null; total_return_pct?: number | null };
    worst_performing_asset?: string | null;
    worst_asset_drawdown?: number;
    data_coverage?: string;
}

function StressTest({ portfolio }: { portfolio: PortfolioSnapshot }) {
    const [eventId, setEventId] = useState(STRESS_EVENTS[0].id);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<BacktestResponse | null>(null);
    const [error, setError] = useState("");

    const run = async () => {
        setIsRunning(true);
        setResult(null);
        setError("");
        try {
            setResult(await runBacktest({ assets: portfolio.assets, event_id: eventId }));
        } catch (err) {
            setError(extractError(err));
        } finally {
            setIsRunning(false);
        }
    };

    const analysis = result?.analysis as BacktestAnalysis | undefined;
    const m = analysis?.portfolio_metrics;

    return (
        <Card>
            <CardHeader
                title="Stress test"
                description={`Replays your latest holdings (${formatDate(portfolio.created_at)}) through a past market crisis, as if you'd held them unchanged.`}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Historical event" className="flex-1">
                    <Select value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={isRunning}>
                        {STRESS_EVENTS.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                                {ev.name} ({ev.period})
                            </option>
                        ))}
                    </Select>
                </Field>
                <Button onClick={run} disabled={isRunning} className="h-10">
                    {isRunning && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    {isRunning ? "Running…" : "Run stress test"}
                </Button>
            </div>

            {error && <p role="alert" className="mt-4 text-sm text-negative-text">{error}</p>}

            {analysis?.error && <p className="mt-4 text-sm text-warning-text">{analysis.error}</p>}

            {analysis && !analysis.error && (
                <div className="mt-6 pt-5 border-t border-line space-y-5" aria-live="polite">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-muted">Worst peak-to-trough fall</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">
                                {m?.max_drawdown_pct != null ? `${m.max_drawdown_pct.toFixed(1)}%` : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">Change over the whole period</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">
                                {m?.total_return_pct != null ? formatPercent(m.total_return_pct) : "—"}
                            </p>
                        </div>
                        {analysis.worst_performing_asset && (
                            <div>
                                <p className="text-xs text-muted">Hardest hit</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">
                                    {analysis.worst_performing_asset}
                                    <span className="text-sm font-normal text-muted">
                                        {" "}{analysis.worst_asset_drawdown?.toFixed(1)}%
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                    {analysis.context && <p className="text-sm text-fg-2">{analysis.context}</p>}
                    {result?.llm_explanation && (
                        <div>
                            <p className="text-xs text-muted mb-1">Summary written by a language model. The figures above are computed.</p>
                            <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">{result.llm_explanation}</p>
                        </div>
                    )}
                    <p className="text-xs text-muted">
                        {analysis.data_coverage ? `${analysis.data_coverage}. ` : ""}
                        Assets without price history for the period are left out. Past crises don&apos;t predict future ones.
                    </p>
                </div>
            )}
        </Card>
    );
}

// Label points by date, adding the time when several fall on the same day
function withReadableDates(points: { at: string; value: number }[]) {
    const days = points.map((p) => formatDate(p.at));
    const repeated = new Set(days.filter((d, i) => days.indexOf(d) !== i));
    return points.map((p, i) => ({
        value: p.value,
        date: repeated.has(days[i])
            ? `${days[i]}, ${parseServerDate(p.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : days[i],
    }));
}

export default function AnalyticsPage() {
    const [portfolios, setPortfolios] = useState<PortfolioSnapshot[]>([]);
    const [decisions, setDecisions] = useState<DecisionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        Promise.all([getPortfolioHistory(), getDecisionLogs()])
            .then(([p, d]) => {
                setPortfolios(p.portfolios);
                setDecisions(d.decisions);
            })
            .catch((err) => setLoadError(extractError(err)))
            .finally(() => setIsLoading(false));
    }, []);

    const valueData = withReadableDates([...portfolios].reverse().map((p) => ({ at: p.created_at, value: snapshotValue(p) })));
    const riskData = withReadableDates(
        decisions
            .filter((d) => d.action === "portfolio_analysis" && d.ai_analysis)
            .reverse()
            .map((d) => ({ at: d.created_at, value: d.ai_analysis!.risk.risk_score }))
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <PageHeader
                numeral={APP_CHAPTERS.trends.numeral}
                caption={APP_CHAPTERS.trends.caption} title="Trends & stress tests" description="How your saved analyses have changed, and how your holdings hold up in a crisis." />

            {loadError && (
                <p role="alert" className="px-4 py-3 rounded-lg bg-negative-soft text-sm text-negative-text">
                    Couldn&apos;t load your data: {loadError}
                </p>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-40 rounded-xl" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            ) : portfolios.length === 0 ? (
                !loadError && (
                    <Card>
                        <EmptyState
                            icon={<LineChartIcon className="w-5 h-5" />}
                            title="No analyses yet"
                            description="Trends appear once you've saved a couple of analyses."
                            action={<Link href="/dashboard/portfolio" className={buttonStyles()}>Run an analysis</Link>}
                        />
                    </Card>
                )
            ) : (
                <>
                    <StressTest portfolio={portfolios[0]} />

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader
                                title="Risk score at each analysis"
                                description="0 to 5. Lines mark the Moderate and High bands."
                            />
                            {riskData.length > 1 ? (
                                <TrendChart
                                    data={riskData}
                                    yDomain={[0, 5]}
                                    yTicks={[0, 1, 2, 3, 4, 5]}
                                    format={(v) => `${v.toFixed(2)} / 5`}
                                    references={[
                                        { y: RISK_THRESHOLDS.moderate, label: "Moderate" },
                                        { y: RISK_THRESHOLDS.high, label: "High" },
                                    ]}
                                    ariaLabel={`Risk score over ${riskData.length} analyses, latest ${riskData.at(-1)?.value.toFixed(2)}`}
                                />
                            ) : (
                                <p className="text-sm text-muted">Run another analysis to see a trend.</p>
                            )}
                        </Card>
                        <Card>
                            <CardHeader
                                title="Value entered at each analysis"
                                description="The holdings you entered each time. Not live performance tracking."
                            />
                            {valueData.length > 1 ? (
                                <TrendChart
                                    data={valueData}
                                    format={formatCurrency}
                                    yTickFormat={formatCompactCurrency}
                                    ariaLabel={`Portfolio value over ${valueData.length} analyses, latest ${formatCurrency(valueData.at(-1)!.value)}`}
                                />
                            ) : (
                                <p className="text-sm text-muted">Run another analysis to see a trend.</p>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
