import React from "react";
import Card from "@/components/ui/Card";

interface MetricCardProps {
    label: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: React.ReactNode;
}

export default function MetricCard({
    label,
    value,
    change,
    changeType = "neutral",
    icon,
}: MetricCardProps) {
    const changeColor = {
        positive: "text-emerald-400",
        negative: "text-red-400",
        neutral: "text-gray-400",
    };

    return (
        <Card className="flex flex-col gap-4 hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">{label}</span>
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
                {change && (
                    <p className={`text-sm mt-1 font-medium ${changeColor[changeType]}`}>
                        {change}
                    </p>
                )}
            </div>
        </Card>
    );
}
