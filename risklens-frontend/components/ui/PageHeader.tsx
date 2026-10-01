import React from "react";

export default function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-fg">{title}</h1>
                {description && <p className="text-sm text-muted mt-1">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
