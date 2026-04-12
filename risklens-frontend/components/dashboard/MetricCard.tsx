import React from "react";
import Card from "@/components/ui/Card";

interface MetricCardProps {
    label: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: React.ReactNode;
    isLoading?: boolean;
}

export default function MetricCard({
    label,
    value,
    change,
    changeType,
    icon,
    isLoading = false,
}: MetricCardProps) {
    const changeColor =
        changeType === "positive"
            ? "text-emerald-400"
            : changeType === "negative"
              ? "text-red-400"
              : "text-gray-500";

    return (
        <Card>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                        {label}
                    </p>
                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-7 w-32 rounded-lg bg-white/[0.06] animate-pulse" />
                            <div className="h-4 w-24 rounded-lg bg-white/[0.04] animate-pulse" />
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-semibold tracking-tight text-white">
                                {value}
                            </p>
                            <p className={`text-xs mt-1.5 ${changeColor}`}>
                                {change}
                            </p>
                        </>
                    )}
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] text-gray-400">
                    {icon}
                </div>
            </div>
        </Card>
    );
}
