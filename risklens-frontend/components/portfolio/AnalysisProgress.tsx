"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

// Only states the client can actually observe. The backend runs pricing,
// risk analysis, explanation and proof generation inside a single request,
// so we don't pretend to know which of those is currently running.
export type AnalysisStep =
    | "idle"
    | "server"
    | "done"
    | "error";

interface AnalysisProgressProps {
    currentStep: AnalysisStep;
    error?: string;
    // Server-side work items to list for context while waiting
    serverTasks?: string[];
}

const DEFAULT_SERVER_TASKS = [
    "Resolve live prices for assets without a value",
    "Compute allocation, volatility and correlation metrics",
    "Generate a plain-language explanation",
    "Save the analysis to your history",
];

// Counts from mount; the parent remounts this component (via `key`) per run.
function useElapsedSeconds(running: boolean) {
    const [start] = useState(() => Date.now());
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
        return () => clearInterval(id);
    }, [running, start]);

    return seconds;
}

function formatElapsed(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export default function AnalysisProgress({
    currentStep,
    error,
    serverTasks = DEFAULT_SERVER_TASKS,
}: AnalysisProgressProps) {
    const isRunning = currentStep === "server";
    const elapsed = useElapsedSeconds(isRunning);

    if (currentStep === "idle") return null;

    const title =
        currentStep === "done"
            ? "Analysis complete"
            : currentStep === "error"
              ? "Analysis failed"
              : "Analyzing portfolio";

    return (
        <div
            className="bg-surface rounded-xl border border-line p-5 sm:p-6 space-y-4"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                {currentStep === "done" ? (
                    <CheckCircle className="w-5 h-5 text-positive-text" />
                ) : currentStep === "error" ? (
                    <XCircle className="w-5 h-5 text-negative-text" />
                ) : (
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                )}
                <h3 className="text-sm font-semibold text-fg">{title}</h3>
                {isRunning && (
                    <span className="ml-auto text-xs text-muted tabular-nums">
                        {formatElapsed(elapsed)}
                    </span>
                )}
            </div>

            {/* Indeterminate bar: we don't know real progress, so we don't fake a percentage */}
            {isRunning && (
                <div className="h-1 rounded-full bg-surface-2 overflow-hidden relative">
                    <div className="absolute top-0 h-full w-1/3 rounded-full bg-accent animate-[indeterminate_1.6s_ease-in-out_infinite]" />
                </div>
            )}

            {currentStep === "server" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted">
                        The server is working through these steps. This usually takes under a
                        minute; the first run is slower while the language model loads.
                    </p>
                    <ul className="space-y-1 text-xs text-fg-2 list-disc pl-5">
                        {serverTasks.map((task) => (
                            <li key={task}>{task}</li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <div role="alert" className="px-4 py-3 rounded-lg bg-negative-soft">
                    <p className="text-xs text-negative-text">{error}</p>
                </div>
            )}
        </div>
    );
}
