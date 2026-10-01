"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import type { Finding } from "@/lib/analysis";

const LABEL = { critical: "Act", warning: "Watch", info: "Note" } as const;

/** Findings sorted by severity. With `limit`, the rest sit behind a toggle unless `expandable` is false. */
export default function Findings({
    findings,
    limit,
    expandable = true,
}: {
    findings: Finding[];
    limit?: number;
    expandable?: boolean;
}) {
    const [showAll, setShowAll] = useState(false);
    if (findings.length === 0) return <p className="text-sm text-muted">No notable findings.</p>;

    const shown = limit && !showAll ? findings.slice(0, limit) : findings;
    const hidden = findings.length - shown.length;

    return (
        <div>
            <ul className="divide-y divide-line">
                {shown.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                        <Badge tone={f.tone} className="w-14 justify-center shrink-0">
                            {LABEL[f.severity]}
                        </Badge>
                        <p className="text-sm text-fg-2 leading-relaxed">{f.message}</p>
                    </li>
                ))}
            </ul>
            {expandable && limit && findings.length > limit && (
                <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="mt-3 text-xs font-medium text-accent-text hover:underline"
                    aria-expanded={showAll}
                >
                    {showAll ? "Show fewer" : `Show ${hidden} more`}
                </button>
            )}
        </div>
    );
}
