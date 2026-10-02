import React from "react";

export default function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            {icon && (
                <div className="w-11 h-11 rounded-full border border-line-strong text-muted flex items-center justify-center mb-3">
                    {icon}
                </div>
            )}
            <p className="font-serif text-xl text-fg">{title}</p>
            {description && <p className="text-xs text-muted mt-1 max-w-xs">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
