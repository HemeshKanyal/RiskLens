"use client";

import React, { useState } from "react";
import { FileText, Camera, Link2, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { APP_CHAPTERS } from "@/lib/chapters";
import SegmentedControl from "@/components/ui/SegmentedControl";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import AssetForm from "@/components/portfolio/AssetForm";
import ScreenshotUploader from "@/components/portfolio/ScreenshotUploader";
import AnalysisProgress from "@/components/portfolio/AnalysisProgress";
import type { AnalysisStep } from "@/components/portfolio/AnalysisProgress";
import AnalysisResults from "@/components/analysis/AnalysisResults";
import type { Asset, AnalysisResponse, SimulationResponse } from "@/lib/types";
import { analyzePortfolio, extractError, simulatePortfolio } from "@/lib/api";

type InputMethod = "manual" | "screenshot" | "broker";
type RiskProfile = "conservative" | "balanced" | "aggressive";

const SIMULATION_TASKS = [
    "Resolve live prices for assets without a value",
    "Compute allocation, volatility and correlation metrics",
    "Generate a plain-language explanation (nothing is saved)",
];

const LOOKBACK_OPTIONS = [30, 60, 90, 180];

type Result =
    | { kind: "analysis"; data: AnalysisResponse; lookbackDays: number; asOf: string }
    | { kind: "simulation"; data: SimulationResponse; lookbackDays: number; asOf: string };

export default function PortfolioPage() {
    const [method, setMethod] = useState<InputMethod>("manual");
    const [assets, setAssets] = useState<Asset[]>([{ symbol: "", type: "stock", quantity: null, value: null }]);
    const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
    const [lookbackDays, setLookbackDays] = useState(90);
    const [step, setStep] = useState<AnalysisStep>("idle");
    const [error, setError] = useState("");
    const [result, setResult] = useState<Result | null>(null);
    const [runMode, setRunMode] = useState<"analyze" | "simulate">("analyze");
    const [runId, setRunId] = useState(0);

    const isBusy = step === "server";

    const handleScreenshotExtracted = (extracted: Asset[]) => {
        setAssets(extracted);
        setMethod("manual"); // review before analyzing
    };

    const startRun = (mode: "analyze" | "simulate") => {
        const validAssets = assets.filter((a) => a.symbol.trim() && (a.value || a.quantity));
        if (validAssets.length === 0) {
            toast.error("Add at least one asset with a symbol and a quantity or value");
            return null;
        }
        setResult(null);
        setError("");
        setRunMode(mode);
        setRunId((id) => id + 1);
        setStep("server");
        return validAssets;
    };

    const fail = (err: unknown) => {
        const msg = extractError(err);
        setStep("error");
        setError(msg);
        toast.error(msg);
    };

    const handleAnalyze = async () => {
        const validAssets = startRun("analyze");
        if (!validAssets) return;
        const lookback = lookbackDays;

        try {
            const data = await analyzePortfolio({
                assets: validAssets,
                risk_profile: riskProfile,
                lookback_days: lookback,
            });
            setStep("done");
            setResult({ kind: "analysis", data, lookbackDays: lookback, asOf: new Date().toLocaleString() });
        } catch (err) {
            fail(err);
        }
    };

    const handleSimulate = async () => {
        const validAssets = startRun("simulate");
        if (!validAssets) return;
        const lookback = lookbackDays;

        try {
            const data = await simulatePortfolio({
                assets: validAssets,
                risk_profile: riskProfile,
                lookback_days: lookback,
                label: "What-If Simulation",
            });
            setStep("done");
            setResult({ kind: "simulation", data, lookbackDays: lookback, asOf: new Date().toLocaleString() });
        } catch (err) {
            fail(err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <PageHeader
                numeral={APP_CHAPTERS.analysis.numeral}
                caption={APP_CHAPTERS.analysis.caption}
                title="New analysis"
                description="Enter your holdings to get a risk and diversification breakdown."
            />

            <Card>
                <SegmentedControl<InputMethod>
                    ariaLabel="How to add holdings"
                    value={method}
                    onChange={setMethod}
                    className="w-full sm:w-auto mb-5"
                    options={[
                        { value: "manual", label: <><FileText className="w-4 h-4 hidden sm:block" aria-hidden="true" />Manual</> },
                        { value: "screenshot", label: <><Camera className="w-4 h-4 hidden sm:block" aria-hidden="true" />Screenshot</> },
                        { value: "broker", label: <><Link2 className="w-4 h-4 hidden sm:block" aria-hidden="true" />Broker</> },
                    ]}
                />

                {method === "manual" && <AssetForm assets={assets} setAssets={setAssets} />}
                {method === "screenshot" && <ScreenshotUploader onExtracted={handleScreenshotExtracted} />}
                {method === "broker" && (
                    <EmptyState
                        icon={<Link2 className="w-5 h-5" />}
                        title="Broker import isn't available yet"
                        description="Add holdings manually or upload a screenshot of your brokerage holdings page."
                    />
                )}

                {method === "manual" && (
                    <div className="mt-6 pt-5 border-t border-line flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-xs font-medium text-fg-2 mb-1.5">Risk profile</p>
                                <SegmentedControl<RiskProfile>
                                    ariaLabel="Risk profile"
                                    value={riskProfile}
                                    onChange={setRiskProfile}
                                    options={[
                                        { value: "conservative", label: "Conservative" },
                                        { value: "balanced", label: "Balanced" },
                                        { value: "aggressive", label: "Aggressive" },
                                    ]}
                                />
                            </div>
                            <div className="w-40">
                                <label htmlFor="lookback" className="block text-xs font-medium text-fg-2 mb-1.5">
                                    Price history
                                </label>
                                <Select
                                    id="lookback"
                                    value={lookbackDays}
                                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                                    className="h-9"
                                >
                                    {LOOKBACK_OPTIONS.map((d) => (
                                        <option key={d} value={d}>Last {d} days</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={handleSimulate} disabled={isBusy} className="flex-1 sm:flex-none">
                                    <FlaskConical className="w-4 h-4" aria-hidden="true" />
                                    Simulate
                                </Button>
                                <Button onClick={handleAnalyze} disabled={isBusy} className="flex-1 sm:flex-none">
                                    Analyze portfolio
                                </Button>
                            </div>
                            <p className="text-xs text-muted">
                                Analyze saves the result to your history. Simulate saves nothing.
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {step !== "idle" && !result && (
                <AnalysisProgress
                    key={runId}
                    currentStep={step}
                    error={error}
                    serverTasks={runMode === "simulate" ? SIMULATION_TASKS : undefined}
                />
            )}

            {result?.kind === "analysis" && (
                <AnalysisResults
                    analysis={result.data.ai_analysis}
                    explanation={result.data.llm_explanation}
                    livePrices={result.data.live_prices_used}
                    lookbackDays={result.lookbackDays}
                    asOf={result.asOf}
                    snapshotHash={result.data.snapshot_hash}
                />
            )}
            {result?.kind === "simulation" && (
                <AnalysisResults
                    analysis={result.data.ai_analysis}
                    explanation={result.data.llm_explanation}
                    livePrices={result.data.live_prices_used}
                    lookbackDays={result.lookbackDays}
                    asOf={result.asOf}
                />
            )}
        </div>
    );
}
