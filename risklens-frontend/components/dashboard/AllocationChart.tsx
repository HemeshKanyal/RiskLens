"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Card from "@/components/ui/Card";

const data = [
    { name: "Stocks", value: 45, color: "#3B82F6" },
    { name: "Crypto", value: 25, color: "#A855F7" },
    { name: "ETFs", value: 20, color: "#06B6D4" },
    { name: "Commodities", value: 10, color: "#F59E0B" },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a2235] border border-white/[0.08] rounded-xl px-4 py-2.5 shadow-xl">
                <p className="text-sm font-medium text-white">{payload[0].name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{payload[0].value}% allocation</p>
            </div>
        );
    }
    return null;
}

export default function AllocationChart() {
    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-white">Asset Allocation</h3>
                    <p className="text-xs text-gray-500 mt-1">Distribution across asset classes</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 font-medium">
                    Live
                </div>
            </div>

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
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5">
                        <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className="text-xs text-gray-400 truncate">{item.name}</span>
                            <span className="text-xs font-medium text-gray-300 ml-2">{item.value}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
