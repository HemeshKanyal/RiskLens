import React from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function Stat({
    label,
    value,
    hint,
    isLoading = false,
}: {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    isLoading?: boolean;
}) {
    return (
        <Card className="min-w-0">
            <p className="font-fell italic text-sm text-muted">{label}</p>
            {isLoading ? (
                <div className="mt-2 space-y-2">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-3.5 w-20" />
                </div>
            ) : (
                <>
                    <div className="mt-1 text-3xl font-semibold tracking-tight text-fg truncate">{value}</div>
                    {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
                </>
            )}
        </Card>
    );
}
