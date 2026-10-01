"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, History } from "lucide-react";
import TxLink from "@/components/ui/TxLink";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { buttonStyles } from "@/components/ui/Button";
import RiskMeter, { RiskBadge } from "@/components/analysis/RiskMeter";
import AllocationBar from "@/components/analysis/AllocationBar";
import Findings from "@/components/analysis/Findings";
import { getDecisionLogs, extractError } from "@/lib/api";
import { buildAnalysisView } from "@/lib/analysis";
import type { DecisionLog } from "@/lib/types";
import { formatDate, formatRelativeTime, truncateHash } from "@/lib/utils";
import { cn } from "@/lib/cn";

type Filter = "all" | "portfolio_analysis" | "kyc_verification";

function HashRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted">{label}</span>
            <span className="font-mono text-fg-2 truncate">{truncateHash(value, 10)}</span>
        </div>
    );
}

function DecisionDetails({ decision }: { decision: DecisionLog }) {
    const view = useMemo(() => (decision.ai_analysis ? buildAnalysisView(decision.ai_analysis) : null), [decision]);

    return (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 space-y-5">
            {view && (
                <div className="grid gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
                    <div className="space-y-5">
                        <RiskMeter score={view.score} level={view.level} size="sm" />
                        <div>
                            <p className="text-xs font-medium text-muted mb-2">Allocation</p>
                            <AllocationBar weights={view.classWeights} />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted mb-2">Findings</p>
                        <Findings findings={view.findings} limit={4} />
                    </div>
                </div>
            )}

            {decision.llm_explanation && (
                <div>
                    <p className="text-xs font-medium text-muted mb-1.5">Written explanation</p>
                    <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">{decision.llm_explanation}</p>
                </div>
            )}

            <div className="pt-4 border-t border-line space-y-2">
                {decision.snapshot_hash && <HashRow label="Snapshot hash" value={decision.snapshot_hash} />}
                {decision.identity_commitment_hash && <HashRow label="Identity hash" value={decision.identity_commitment_hash} />}
                <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-muted">Transaction</span>
                    {decision.blockchain_tx ? (
                        <TxLink hash={decision.blockchain_tx} chars={8} />
                    ) : (
                        <span className="text-muted">None</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HistoryPage() {
    const [decisions, setDecisions] = useState<DecisionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [filter, setFilter] = useState<Filter>("all");

    useEffect(() => {
        getDecisionLogs()
            .then((d) => setDecisions(d.decisions))
            .catch((err) => setLoadError(extractError(err)))
            .finally(() => setIsLoading(false));
    }, []);

    const shown = decisions.filter((d) => filter === "all" || d.action === filter);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader title="History" description="Every saved analysis and identity attestation, newest first." />

            {decisions.length > 0 && (
                <SegmentedControl<Filter>
                    ariaLabel="Filter history"
                    value={filter}
                    onChange={(f) => {
                        setFilter(f);
                        setOpenIndex(null);
                    }}
                    size="sm"
                    options={[
                        { value: "all", label: "All" },
                        { value: "portfolio_analysis", label: "Analyses" },
                        { value: "kyc_verification", label: "Attestations" },
                    ]}
                />
            )}

            {loadError && (
                <p role="alert" className="px-4 py-3 rounded-lg bg-negative-soft text-sm text-negative-text">
                    Couldn&apos;t load history: {loadError}
                </p>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
            ) : shown.length === 0 && !loadError ? (
                <Card>
                    <EmptyState
                        icon={<History className="w-5 h-5" />}
                        title="Nothing here yet"
                        description="Analyses you run are saved here with their findings and on-chain record."
                        action={<Link href="/dashboard/portfolio" className={buttonStyles()}>Run an analysis</Link>}
                    />
                </Card>
            ) : (
                <ul className="space-y-3">
                    {shown.map((d, idx) => {
                        const isOpen = openIndex === idx;
                        const isAnalysis = d.action === "portfolio_analysis";
                        const risk = d.ai_analysis?.risk;
                        const panelId = `history-panel-${idx}`;
                        return (
                            <li key={`${d.created_at}-${idx}`}>
                                <Card padded={false}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        className="w-full flex items-center gap-3 px-5 py-4 sm:px-6 text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-fg">
                                                {isAnalysis ? "Portfolio analysis" : "Identity attestation"}
                                            </p>
                                            <p className="text-xs text-muted mt-0.5">
                                                {formatDate(d.created_at)} · {formatRelativeTime(d.created_at)}
                                            </p>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2">
                                            {risk && <RiskBadge level={risk.risk_level} />}
                                            {risk && <span className="text-sm text-fg tabular-nums">{risk.risk_score.toFixed(2)}</span>}
                                            {d.blockchain_status === "confirmed" ? (
                                                <Badge tone="positive" dot>Anchored</Badge>
                                            ) : (
                                                <Badge dot>Not anchored</Badge>
                                            )}
                                        </div>
                                        <ChevronDown
                                            className={cn("w-4 h-4 text-muted transition-transform", isOpen && "rotate-180")}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    {isOpen && (
                                        <div id={panelId}>
                                            <div className="sm:hidden px-5 pb-3 flex flex-wrap gap-2">
                                                <Badge tone={d.blockchain_status === "confirmed" ? "positive" : "neutral"} dot>
                                                    {d.blockchain_status === "confirmed" ? "Anchored" : "Not anchored"}
                                                </Badge>
                                            </div>
                                            <DecisionDetails decision={d} />
                                        </div>
                                    )}
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
