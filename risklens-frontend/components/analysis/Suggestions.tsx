"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { submitFeedback, extractError } from "@/lib/api";
import toast from "react-hot-toast";

type Action = "accept" | "reject" | "modify" | "ignore";

const ACTIONS: { action: Action; label: string }[] = [
    { action: "accept", label: "I'll do this" },
    { action: "modify", label: "Partly" },
    { action: "reject", label: "Not for me" },
];

/**
 * Rebalancing suggestions. Feedback is only offered for saved analyses
 * (it's keyed to the snapshot) and only shapes future explanations.
 */
export default function Suggestions({
    suggestions,
    snapshotHash,
}: {
    suggestions: string[];
    snapshotHash?: string;
}) {
    const [sent, setSent] = useState<Action | null>(null);
    const [busy, setBusy] = useState(false);

    if (suggestions.length === 0) {
        return <p className="text-sm text-muted">Your allocation is within range for this risk profile.</p>;
    }

    const send = async (action: Action) => {
        if (!snapshotHash) return;
        setBusy(true);
        try {
            await submitFeedback({ snapshot_hash: snapshotHash, action });
            setSent(action);
        } catch (err) {
            toast.error(extractError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <ul className="space-y-2">
                {suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-fg-2">
                        <span className="text-muted" aria-hidden="true">→</span>
                        {/* Engine appends "(Profile: x)"; the profile is already shown elsewhere */}
                        <span>{s.replace(/\s*\(Profile: \w+\)\.?$/, ".")}</span>
                    </li>
                ))}
            </ul>
            {snapshotHash && (
                <div className="mt-4 pt-4 border-t border-line">
                    {sent ? (
                        <p className="text-xs text-positive-text inline-flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Thanks. This tailors future explanations; it doesn&apos;t change your risk score.
                        </p>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted mr-1">Will you act on this?</span>
                            {ACTIONS.map(({ action, label }) => (
                                <Button key={action} size="sm" variant="secondary" disabled={busy} onClick={() => send(action)}>
                                    {label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
