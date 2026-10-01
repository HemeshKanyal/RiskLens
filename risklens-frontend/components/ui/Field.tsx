"use client";

import React, { useId } from "react";
import { cn } from "@/lib/cn";

const control =
    "w-full h-10 px-3 rounded-lg bg-surface border border-line-strong text-sm text-fg placeholder:text-muted " +
    "outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft " +
    "disabled:opacity-50 aria-[invalid=true]:border-negative";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function Input({ className, ...props }, ref) {
        return <input ref={ref} className={cn(control, className)} {...props} />;
    }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    function Select({ className, ...props }, ref) {
        return <select ref={ref} className={cn(control, "pr-8 cursor-pointer", className)} {...props} />;
    }
);

/**
 * Label + control + hint/error, wired together with ids so screen readers
 * announce the label and any error. The child receives id/aria props.
 */
export function Field({
    label,
    hint,
    error,
    className,
    children,
}: {
    label: React.ReactNode;
    hint?: React.ReactNode;
    error?: string;
    className?: string;
    children: React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
}) {
    const id = useId();
    const descId = hint || error ? `${id}-desc` : undefined;

    return (
        <div className={cn("space-y-1.5", className)}>
            <label htmlFor={id} className="block text-xs font-medium text-fg-2">
                {label}
            </label>
            {React.cloneElement(children, {
                id,
                "aria-describedby": descId,
                "aria-invalid": error ? true : undefined,
            })}
            {(error || hint) && (
                <p id={descId} className={cn("text-xs", error ? "text-negative-text" : "text-muted")}>
                    {error || hint}
                </p>
            )}
        </div>
    );
}
