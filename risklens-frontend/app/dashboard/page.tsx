"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, FileText, LineChart } from "lucide-react";
import toast from "react-hot-toast";
import Card, { CardHeader } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Stat from "@/components/ui/Stat";
import Button, { buttonStyles } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import RiskMeter, { RiskBadge } from "@/components/analysis/RiskMeter";
import AllocationBar from "@/components/analysis/AllocationBar";
import Findings from "@/components/analysis/Findings";
import RecentSnapshots, { snapshotValue } from "@/components/dashboard/RecentSnapshots";
import { getPortfolioHistory, getDecisionLogs, exportReport, extractError } from "@/lib/api";
import { buildAnalysisView } from "@/lib/analysis";
import type { PortfolioSnapshot, DecisionLog } from "@/lib/types";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
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

    const latestPortfolio = portfolios[0];
    const analyses = decisions.filter((d) => d.action === "portfolio_analysis");
    const latest = analyses.find((d) => d.ai_analysis);
    const view = latest?.ai_analysis ? buildAnalysisView(latest.ai_analysis) : null;
    const anchored = analyses.filter((d) => d.blockchain_status === "confirmed").length;

    const classWeights: Record<string, number> = {};
    if (latestPortfolio) {
        const total = snapshotValue(latestPortfolio) || 1;
        for (const a of latestPortfolio.assets) classWeights[a.type] = (classWeights[a.type] || 0) + ((a.value || 0) / total) * 100;
    }

    const runExport = async (format: "csv" | "pdf") => {
        const id = `export-${format}`;
        toast.loading(`Preparing ${format.toUpperCase()}…`, { id });
        try {
            await exportReport(format);
            toast.success(`${format.toUpperCase()} downloaded`, { id });
        } catch (err) {
            toast.error(extractError(err), { id });
        }
    };

    const hasData = portfolios.length > 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
                title="Overview"
                description={hasData ? "Your latest analysis and saved snapshots." : undefined}
                actions={
                    <>
                        {hasData && (
                            <>
                                <Button variant="secondary" size="sm" onClick={() => runExport("csv")}>
                                    <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                                    CSV
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => runExport("pdf")}>
                                    <FileText className="w-4 h-4" aria-hidden="true" />
                                    PDF
                                </Button>
                            </>
                        )}
                        <Link href="/dashboard/portfolio" className={buttonStyles({ size: "sm" })}>
                            New analysis
                        </Link>
                    </>
                }
            />

            {loadError && (
                <p role="alert" className="px-4 py-3 rounded-lg bg-negative-soft text-sm text-negative-text">
                    Couldn&apos;t load your data: {loadError}
                </p>
            )}

            {!isLoading && !hasData && !loadError ? (
                <Card>
                    <EmptyState
                        icon={<LineChart className="w-5 h-5" />}
                        title="No analyses yet"
                        description="Add your holdings to see how risky your portfolio is, where the risk comes from, and how diversified it really is."
                        action={
                            <Link href="/dashboard/portfolio" className={buttonStyles()}>
                                Analyze a portfolio
                            </Link>
                        }
                    />
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Stat
                            label="Portfolio value"
                            isLoading={isLoading}
                            value={latestPortfolio ? formatCurrency(snapshotValue(latestPortfolio)) : "—"}
                            hint={latestPortfolio ? `At last analysis, ${formatRelativeTime(latestPortfolio.created_at)}` : undefined}
                        />
                        <Stat
                            label="Latest risk score"
                            isLoading={isLoading}
                            value={view ? <>{view.score.toFixed(2)}<span className="text-sm font-normal text-muted"> / 5</span></> : "—"}
                            hint={view ? <RiskBadge level={view.level} /> : undefined}
                        />
                        <Stat
                            label="Analyses"
                            isLoading={isLoading}
                            value={analyses.length}
                            hint={`${anchored} anchored on-chain`}
                        />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader
                                title="Latest analysis"
                                description={latest ? formatRelativeTime(latest.created_at) : undefined}
                                action={
                                    <Link href="/dashboard/history" className="text-xs font-medium text-accent-text hover:underline">
                                        Full details
                                    </Link>
                                }
                            />
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-10 w-40" />
                                    <Skeleton className="h-2" />
                                    <Skeleton className="h-16" />
                                </div>
                            ) : view ? (
                                <div className="grid gap-6 md:grid-cols-[minmax(0,14rem)_1fr]">
                                    <RiskMeter score={view.score} level={view.level} size="sm" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-muted mb-2">Top findings</p>
                                        <Findings findings={view.findings} limit={3} expandable={false} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted">No analysis details saved.</p>
                            )}
                        </Card>

                        <Card>
                            <CardHeader title="Allocation" description="By asset class, at last analysis" />
                            {isLoading ? <Skeleton className="h-16" /> : <AllocationBar weights={classWeights} />}
                        </Card>
                    </div>

                    <RecentSnapshots portfolios={portfolios} isLoading={isLoading} />
                </>
            )}
        </div>
    );
}
