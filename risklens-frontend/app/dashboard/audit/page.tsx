"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge, { type Tone } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Stat from "@/components/ui/Stat";
import EmptyState from "@/components/ui/EmptyState";
import { buttonStyles } from "@/components/ui/Button";
import { getDecisionAudit, extractError } from "@/lib/api";
import type { AuditResponse } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ACTION_LABEL: Record<string, { label: string; tone: Tone }> = {
    accept: { label: "Followed", tone: "positive" },
    modify: { label: "Partly", tone: "accent" },
    reject: { label: "Declined", tone: "negative" },
    ignore: { label: "Ignored", tone: "neutral" },
    no_response: { label: "No response", tone: "neutral" },
};

export default function AuditPage() {
    const [audit, setAudit] = useState<AuditResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        getDecisionAudit()
            .then(setAudit)
            .catch((err) => setLoadError(extractError(err)))
            .finally(() => setIsLoading(false));
    }, []);

    const vol = audit?.volatility_patterns;
    const isEmpty = !isLoading && !loadError && (!audit || audit.total_decisions === 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <PageHeader
                title="Decision patterns"
                description="How you've responded to suggestions. This only tailors future explanations; it never changes a risk score."
            />

            {loadError && (
                <p role="alert" className="px-4 py-3 rounded-lg bg-negative-soft text-sm text-negative-text">
                    Couldn&apos;t load your decisions: {loadError}
                </p>
            )}

            {isEmpty ? (
                <Card>
                    <EmptyState
                        icon={<Activity className="w-5 h-5" />}
                        title="No decisions recorded yet"
                        description="After an analysis, tell us whether you'll act on its suggestions. Patterns show up here."
                        action={<Link href="/dashboard/portfolio" className={buttonStyles()}>Run an analysis</Link>}
                    />
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <Stat label="Analyses" isLoading={isLoading} value={audit?.total_decisions ?? "—"} />
                        <Stat
                            label="You responded to"
                            isLoading={isLoading}
                            value={audit ? `${Math.round(audit.response_rate)}%` : "—"}
                            hint="of analyses"
                        />
                        <Stat
                            label="You followed"
                            isLoading={isLoading}
                            value={audit ? `${Math.round(audit.accept_rate)}%` : "—"}
                            hint="of suggestions you responded to"
                        />
                        <Stat
                            label="Declined in volatile markets"
                            isLoading={isLoading}
                            value={vol && vol.high_vol_total > 0 ? `${vol.high_vol_rejects} of ${vol.high_vol_total}` : "—"}
                            hint="when volatility was above 30%"
                        />
                    </div>

                    {audit && audit.drifts.length > 0 && (
                        <Card>
                            <CardHeader title="Patterns noticed" />
                            <ul className="space-y-2">
                                {audit.drifts.map((d, i) => (
                                    <li key={i} className="text-sm text-fg-2 flex gap-2">
                                        <span className="text-muted" aria-hidden="true">→</span>
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {audit && audit.audit_trail.length > 0 && (
                        <Card padded={false}>
                            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                                <CardHeader title="Decision log" className="mb-3" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-muted border-y border-line">
                                            <th scope="col" className="py-2 pl-5 sm:pl-6 pr-3 font-medium">Date</th>
                                            <th scope="col" className="py-2 pr-3 font-medium">Your response</th>
                                            <th scope="col" className="py-2 pr-6 font-medium text-right">Risk score</th>
                                            <th scope="col" className="py-2 pr-5 sm:pr-6 font-medium hidden sm:table-cell">Reason given</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audit.audit_trail.map((e, i) => {
                                            const a = ACTION_LABEL[e.user_action] ?? { label: e.user_action, tone: "neutral" as Tone };
                                            return (
                                                <tr key={i} className="border-b border-line last:border-0">
                                                    <td className="py-3 pl-5 sm:pl-6 pr-3 text-fg whitespace-nowrap">{formatDate(e.timestamp)}</td>
                                                    <td className="py-3 pr-3"><Badge tone={a.tone}>{a.label}</Badge></td>
                                                    <td className="py-3 pr-6 text-right tabular-nums text-fg-2">
                                                        {e.ai_risk_score != null ? e.ai_risk_score.toFixed(2) : "—"}
                                                    </td>
                                                    <td className="py-3 pr-5 sm:pr-6 text-fg-2 hidden sm:table-cell">{e.user_reasoning || "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
