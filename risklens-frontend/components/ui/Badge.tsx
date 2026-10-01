import React from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "accent" | "positive" | "warning" | "negative";

const tones: Record<Tone, string> = {
    neutral: "bg-surface-2 text-fg-2",
    accent: "bg-accent-soft text-accent-text",
    positive: "bg-positive-soft text-positive-text",
    warning: "bg-warning-soft text-warning-text",
    negative: "bg-negative-soft text-negative-text",
};

const dots: Record<Tone, string> = {
    neutral: "bg-muted",
    accent: "bg-accent",
    positive: "bg-positive",
    warning: "bg-warning",
    negative: "bg-negative",
};

export default function Badge({
    tone = "neutral",
    dot = false,
    className,
    children,
}: {
    tone?: Tone;
    dot?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-xs font-medium whitespace-nowrap",
                tones[tone],
                className
            )}
        >
            {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dots[tone])} aria-hidden="true" />}
            {children}
        </span>
    );
}
