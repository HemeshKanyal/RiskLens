import React from "react";

/**
 * Pages open like a chapter of the notebook: a numeral and an Italian
 * caption in old print, then a big title and a plain description.
 */
export default function PageHeader({
    title,
    description,
    actions,
    numeral,
    caption,
}: {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    numeral?: string;
    caption?: string;
}) {
    return (
        <div className="flex flex-col gap-4 pb-2 border-b border-line sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 pb-4">
                {(numeral || caption) && (
                    <p className="font-fell italic text-lg text-accent-text">
                        {numeral && <span className="font-serif not-italic text-muted mr-2">{numeral}</span>}
                        {caption}
                    </p>
                )}
                <h1 className="mt-1 text-4xl sm:text-5xl font-bold tracking-[-0.04em] leading-[0.95] text-fg">{title}</h1>
                {description && <p className="mt-3 font-serif text-lg sm:text-xl leading-snug text-fg-2 max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 pb-4">{actions}</div>}
        </div>
    );
}
