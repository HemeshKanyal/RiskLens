import React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
    as?: "div" | "section" | "article";
    padded?: boolean;
}

export default function Card({ as: Tag = "section", padded = true, className, ...props }: CardProps) {
    return (
        <Tag
            className={cn("bg-surface border border-line rounded-xl", padded && "p-5 sm:p-6", className)}
            {...props}
        />
    );
}

export function CardHeader({
    title,
    description,
    action,
    className,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-start justify-between gap-4 mb-5", className)}>
            <div className="min-w-0">
                <h2 className="text-sm font-semibold text-fg">{title}</h2>
                {description && <p className="text-xs text-muted mt-1">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
