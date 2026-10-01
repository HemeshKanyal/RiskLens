"use client";

import { useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";
import TxLink from "@/components/ui/TxLink";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Disclaimer from "@/components/ui/Disclaimer";
import RiskMeter from "@/components/analysis/RiskMeter";
import AllocationBar from "@/components/analysis/AllocationBar";
import HoldingsTable from "@/components/analysis/HoldingsTable";
import Findings from "@/components/analysis/Findings";
import Suggestions from "@/components/analysis/Suggestions";
import { buildAnalysisView } from "@/lib/analysis";
import { formatCurrency, truncateHash } from "@/lib/utils";
import type { RawAnalysis } from "@/lib/types";

export interface OnChainRecord {
    status: "confirmed" | "failed";
    txHash: string | null;
    snapshotHash: string;
    warning?: string;
}

interface AnalysisResultsProps {
    analysis: RawAnalysis;
    explanation?: string;
    livePrices?: Record<string, number>;
    lookbackDays?: number;
    asOf?: string;
    // Absent for simulations, which are neither saved nor anchored
    record?: OnChainRecord;
}

function ScoreComponent({
    label,
    description,
    score,
    weight,
}: {
    label: string;
    description: string;
    score?: number;
    weight?: number;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm text-fg">{label}</p>
                <p className="text-xs text-muted">{description}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-medium text-fg tabular-nums">{score?.toFixed(2) ?? "—"}</p>
                {weight !== undefined && <p className="text-xs text-muted tabular-nums">{Math.round(weight * 100)}% weight</p>}
            </div>
        </div>
    );
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-fg truncate">{value}</p>
            {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
    );
}

export default function AnalysisResults({
    analysis,
    explanation,
    livePrices,
    lookbackDays,
    asOf,
    record,
}: AnalysisResultsProps) {
    const view = useMemo(() => buildAnalysisView(analysis), [analysis]);
    const [expanded, setExpanded] = useState(false);
    const isSimulation = !record;
    const windowLabel = lookbackDays ? `${lookbackDays}-day` : "lookback";

    return (
        <div className="space-y-4">
            {isSimulation && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent-soft">
                    <FlaskConical className="w-4 h-4 text-accent-text mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="text-sm text-fg-2">
                        <span className="font-medium text-fg">What-if simulation.</span> Nothing was saved to your
                        history or recorded on-chain.
                    </p>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader title="Overall risk" description="0 is lowest, 5 is highest" />
                    <RiskMeter score={view.score} level={view.level} />
                    <div className="mt-5 pt-4 border-t border-line space-y-3">
                        <ScoreComponent
                            label="Asset-class mix"
                            description="How much sits in higher-risk asset classes"
                            score={view.allocationScore}
                            weight={view.allocationWeight}
                        />
                        {view.hasMarketData ? (
                            <ScoreComponent
                                label="Market behaviour"
                                description={`From ${view.volatilityPct?.toFixed(1)}% annualised volatility`}
                                score={view.marketScore}
                                weight={view.marketWeight}
                            />
                        ) : (
                            <p className="text-xs text-warning-text">
                                Market data was unavailable, so this score uses the asset-class mix only.
                            </p>
                        )}
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader title="At a glance" description={view.summary} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Figure label="Total value" value={view.totalValue !== undefined ? formatCurrency(view.totalValue) : "—"} />
                        <Figure
                            label="Volatility"
                            value={view.volatilityPct !== undefined ? `${view.volatilityPct.toFixed(1)}%` : "—"}
                            hint={`annualised, ${windowLabel}`}
                        />
                        <Figure
                            label="Diversification ratio"
                            value={view.diversificationRatio !== undefined ? view.diversificationRatio.toFixed(2) : "—"}
                            hint="above 1 means holdings offset"
                        />
                        <Figure
                            label="Spread score"
                            value={view.diversificationScore !== undefined ? `${view.diversificationScore} / 100` : "—"}
                            hint={view.diversificationLevel ? `${view.diversificationLevel.toLowerCase()}; higher is more spread out` : undefined}
                        />
                    </div>
                    <div className="mt-6">
                        <p className="text-xs font-medium text-muted mb-2">Allocation by asset class</p>
                        <AllocationBar weights={view.classWeights} />
                    </div>
                </Card>
            </div>

            {view.holdings.length > 0 && (
                <Card>
                    <CardHeader
                        title="Where your risk comes from"
                        description="Compare each holding's share of the portfolio with its share of the risk."
                    />
                    <HoldingsTable holdings={view.holdings} />
                </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                <Card>
                    <CardHeader title="Findings" description="Most important first" />
                    <Findings findings={view.findings} limit={5} />
                </Card>
                <Card>
                    <CardHeader title="Suggested changes" description="Based on your selected risk profile" />
                    <Suggestions suggestions={view.suggestions} snapshotHash={record?.snapshotHash} />
                </Card>
            </div>

            {explanation && (
                <Card>
                    <CardHeader
                        title="Written explanation"
                        description="Generated by a language model from the figures above. Check it against them."
                        action={
                            <button
                                type="button"
                                onClick={() => setExpanded((v) => !v)}
                                className="text-xs font-medium text-accent-text hover:underline"
                                aria-expanded={expanded}
                            >
                                {expanded ? "Show less" : "Show all"}
                            </button>
                        }
                    />
                    <p className={`text-sm text-fg-2 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-5"}`}>
                        {explanation}
                    </p>
                </Card>
            )}

            {(record || (livePrices && Object.keys(livePrices).length > 0)) && (
                <Card>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {livePrices && Object.keys(livePrices).length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-muted mb-2">Live prices used</h3>
                                <ul className="flex flex-wrap gap-2">
                                    {Object.entries(livePrices).map(([symbol, price]) => (
                                        <li key={symbol} className="text-xs px-2 py-1 rounded-md bg-surface-2">
                                            <span className="font-mono text-fg">{symbol}</span>{" "}
                                            <span className="text-muted tabular-nums">{formatCurrency(price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {record && (
                            <div>
                                <h3 className="text-xs font-medium text-muted mb-2">On-chain timestamp</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge tone={record.status === "confirmed" ? "positive" : "neutral"} dot>
                                        {record.status === "confirmed" ? "Snapshot hash anchored" : "Not anchored"}
                                    </Badge>
                                    {record.txHash && (
                                        <TxLink hash={record.txHash} chars={6} />
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-muted font-mono break-all">
                                    Snapshot {truncateHash(record.snapshotHash, 10)}
                                </p>
                                {record.warning && <p className="mt-2 text-xs text-warning-text">{record.warning}</p>}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Disclaimer asOf={asOf} />
        </div>
    );
}
