"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Card from "@/components/ui/Card";
import type { Asset } from "@/lib/types";
import { getAssetTypeColor } from "@/lib/utils";

interface AllocationChartProps {
    assets: Asset[];
    isLoading?: boolean;
}

function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a2235] border border-white/[0.08] rounded-xl px-4 py-2.5 shadow-xl">
                <p className="text-sm font-medium text-white">{payload[0].name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {payload[0].value}% allocation
                </p>
            </div>
        );
    }
    return null;
}

export default function AllocationChart({
    assets,
    isLoading = false,
}: AllocationChartProps) {
    // Aggregate assets by type
    const typeMap: Record<string, number> = {};
    let totalValue = 0;

    for (const asset of assets) {
        const v = asset.value || 0;
        totalValue += v;
        const type = asset.type || "stock";
        typeMap[type] = (typeMap[type] || 0) + v;
    }

    const data =
        totalValue > 0
            ? Object.entries(typeMap).map(([name, value]) => ({
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  value: Math.round((value / totalValue) * 100),
                  color: getAssetTypeColor(name),
              }))
            : [];

    const hasData = data.length > 0;

    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-white">
                        Asset Allocation
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Distribution across asset classes
                    </p>
                </div>
                {hasData && (
                    <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 font-medium">
                        {assets.length} assets
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                    <div className="w-[180px] h-[180px] rounded-full bg-white/[0.04] animate-pulse" />
                </div>
            ) : hasData ? (
                <>
                    <div className="flex-1 flex items-center justify-center min-h-[220px]">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {data.map((item) => (
                            <div
                                key={item.name}
                                className="flex items-center gap-2.5"
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <div className="flex items-center justify-between flex-1 min-w-0">
                                    <span className="text-xs text-gray-400 truncate">
                                        {item.name}
                                    </span>
                                    <span className="text-xs font-medium text-gray-300 ml-2">
                                        {item.value}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">No allocation data</p>
                    <p className="text-xs text-gray-600 mt-1">
                        Analyze a portfolio to see your allocation
                    </p>
                </div>
            )}
        </Card>
    );
}
