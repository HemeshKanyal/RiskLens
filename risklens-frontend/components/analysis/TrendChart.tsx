"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine,
} from "recharts";

export interface TrendPoint {
    date: string;
    value: number;
}

function ChartTooltip({
    active,
    payload,
    label,
    format,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
    format: (v: number) => string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-line-strong bg-surface px-3 py-2 shadow-lg">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-sm font-semibold text-fg tabular-nums">{format(payload[0].value)}</p>
        </div>
    );
}

/**
 * Single-series line over time: 2px line, ringed markers, hairline grid,
 * crosshair tooltip. Optional reference lines mark thresholds.
 */
export default function TrendChart({
    data,
    format,
    yDomain,
    yTickFormat,
    yTicks,
    references = [],
    height = 240,
    ariaLabel,
}: {
    data: TrendPoint[];
    format: (v: number) => string;
    yDomain?: [number, number];
    yTickFormat?: (v: number) => string;
    yTicks?: number[];
    references?: { y: number; label: string }[];
    height?: number;
    ariaLabel: string;
}) {
    return (
        <div role="img" aria-label={ariaLabel}>
            <ResponsiveContainer width="100%" height={height} minWidth={0}>
                <LineChart data={data} margin={{ top: 8, right: references.length ? 64 : 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--grid)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                        axisLine={{ stroke: "var(--axis)" }}
                        tickLine={false}
                        minTickGap={24}
                    />
                    <YAxis
                        domain={yDomain ?? ["auto", "auto"]}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={yTickFormat}
                        ticks={yTicks}
                        width={52}
                    />
                    {references.map((r) => (
                        <ReferenceLine
                            key={r.y}
                            y={r.y}
                            stroke="var(--axis)"
                            label={{ value: r.label, position: "right", fill: "var(--muted)", fontSize: 11 }}
                        />
                    ))}
                    <Tooltip
                        content={<ChartTooltip format={format} />}
                        cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
                    />
                    <Line
                        type="linear"
                        dataKey="value"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
