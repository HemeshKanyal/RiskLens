"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface Segment<T extends string> {
    value: T;
    label: React.ReactNode;
    disabled?: boolean;
}

export default function SegmentedControl<T extends string>({
    value,
    onChange,
    options,
    ariaLabel,
    className,
    size = "md",
}: {
    value: T;
    onChange: (value: T) => void;
    options: Segment<T>[];
    ariaLabel: string;
    className?: string;
    size?: "sm" | "md";
}) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={cn("inline-flex p-0.5 rounded-full bg-surface-2 border border-line", className)}
        >
            {options.map((opt) => {
                const selected = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={opt.disabled}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors",
                            size === "sm" ? "h-7 px-2 sm:px-2.5 text-xs" : "h-8 px-2 sm:px-3 text-sm",
                            selected ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted"
                        )}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
