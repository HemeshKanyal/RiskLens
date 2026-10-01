import { AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { RISK_SCALE_MAX, RISK_THRESHOLDS, riskTone } from "@/lib/analysis";
import { cn } from "@/lib/cn";

const fills = {
    positive: "bg-positive",
    warning: "bg-warning",
    negative: "bg-negative",
    neutral: "bg-muted",
    accent: "bg-accent",
} as const;

export function RiskBadge({ level, className }: { level?: string; className?: string }) {
    const tone = riskTone(level);
    const Icon = tone === "positive" ? CheckCircle2 : tone === "negative" ? AlertOctagon : AlertTriangle;
    return (
        <Badge tone={tone} className={className}>
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {level ? `${level} risk` : "Unknown"}
        </Badge>
    );
}

/** Score on the 0–5 scale with the Low/Moderate/High bands marked. */
export default function RiskMeter({
    score,
    level,
    size = "lg",
}: {
    score: number;
    level?: string;
    size?: "sm" | "lg";
}) {
    const pct = Math.min(Math.max(score / RISK_SCALE_MAX, 0), 1) * 100;
    const tone = riskTone(level);

    return (
        <div>
            <div className="flex items-end justify-between gap-3">
                <p className={cn("font-semibold tracking-tight text-fg", size === "lg" ? "text-4xl" : "text-2xl")}>
                    {score.toFixed(2)}
                    <span className="text-base font-normal text-muted"> / {RISK_SCALE_MAX}</span>
                </p>
                <RiskBadge level={level} className="mb-1" />
            </div>
            <div
                className="relative mt-3 h-2 rounded-full bg-surface-2"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={RISK_SCALE_MAX}
                aria-valuenow={score}
                aria-label="Risk score"
            >
                <div className={cn("h-full rounded-full", fills[tone])} style={{ width: `${pct}%` }} />
                {[RISK_THRESHOLDS.moderate, RISK_THRESHOLDS.high].map((t) => (
                    <span
                        key={t}
                        className="absolute top-[-3px] h-[14px] w-[2px] bg-surface"
                        style={{ left: `${(t / RISK_SCALE_MAX) * 100}%` }}
                        aria-hidden="true"
                    />
                ))}
            </div>
            <div className="relative mt-1.5 h-4 text-[11px] text-muted" aria-hidden="true">
                <span className="absolute left-0">Low</span>
                <span className="absolute" style={{ left: `${(RISK_THRESHOLDS.moderate / RISK_SCALE_MAX) * 100}%` }}>
                    Moderate
                </span>
                <span className="absolute" style={{ left: `${(RISK_THRESHOLDS.high / RISK_SCALE_MAX) * 100}%` }}>
                    High
                </span>
            </div>
        </div>
    );
}
