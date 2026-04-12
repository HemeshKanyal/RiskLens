"use client";

import React from "react";
import Card from "@/components/ui/Card";
import type { PortfolioSnapshot } from "@/lib/types";
import { formatCurrency, formatDate, truncateHash } from "@/lib/utils";
import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";

interface PortfolioListProps {
    portfolios: PortfolioSnapshot[];
    isLoading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
    stock: "#3B82F6",
    crypto: "#A855F7",
    etf: "#06B6D4",
    bond: "#10B981",
    commodity: "#F59E0B",
};

export default function PortfolioList({
    portfolios,
    isLoading = false,
}: PortfolioListProps) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-semibold text-white">
                        Portfolio Snapshots
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {portfolios.length > 0
                            ? `${portfolios.length} snapshot${portfolios.length > 1 ? "s" : ""} recorded`
                            : "Your analysis history will appear here"}
                    </p>
                </div>
                <Link
                    href="/dashboard/history"
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                >
                    View All →
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-14 rounded-xl bg-white/[0.03] animate-pulse"
                        />
                    ))}
                </div>
            ) : portfolios.length > 0 ? (
                <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                        <span className="col-span-3">Date</span>
                        <span className="col-span-2">Assets</span>
                        <span className="col-span-2 text-right">Value</span>
                        <span className="col-span-2 text-center">Status</span>
                        <span className="col-span-3 text-right">
                            Blockchain TX
                        </span>
                    </div>

                    {/* Rows */}
                    {portfolios.slice(0, 10).map((portfolio, idx) => {
                        const totalValue = portfolio.assets.reduce(
                            (sum, a) => sum + (a.value || 0),
                            0
                        );

                        // Pick the dominant type color
                        const dominantType = portfolio.assets.reduce(
                            (best, a) => {
                                const v = a.value || 0;
                                return v > (best.value || 0)
                                    ? { type: a.type, value: v }
                                    : best;
                            },
                            { type: "stock", value: 0 }
                        ).type;

                        return (
                            <div
                                key={idx}
                                className="grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer group"
                            >
                                <div className="col-span-3 flex items-center gap-3">
                                    <div
                                        className="w-2 h-8 rounded-full shrink-0"
                                        style={{
                                            backgroundColor:
                                                TYPE_COLORS[dominantType] ||
                                                "#6B7280",
                                        }}
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors block">
                                            {formatDate(portfolio.created_at)}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {portfolio.risk_profile}
                                        </span>
                                    </div>
                                </div>

                                <span className="col-span-2 text-sm text-gray-400">
                                    {portfolio.assets.length} asset
                                    {portfolio.assets.length > 1 ? "s" : ""}
                                </span>

                                <span className="col-span-2 text-right text-sm font-medium text-white">
                                    {formatCurrency(totalValue)}
                                </span>

                                <div className="col-span-2 text-center">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                            portfolio.blockchain_status ===
                                            "confirmed"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                                        }`}
                                    >
                                        <span
                                            className={`w-1 h-1 rounded-full ${
                                                portfolio.blockchain_status ===
                                                "confirmed"
                                                    ? "bg-emerald-400"
                                                    : "bg-red-400"
                                            }`}
                                        />
                                        {portfolio.blockchain_status ===
                                        "confirmed"
                                            ? "Verified"
                                            : "Pending"}
                                    </span>
                                </div>

                                <div className="col-span-3 text-right">
                                    {portfolio.blockchain_tx ? (
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${portfolio.blockchain_tx}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {truncateHash(
                                                portfolio.blockchain_tx,
                                                6
                                            )}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-600">
                                            —
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                        <Plus className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500">
                        No portfolios analyzed yet
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Create your first portfolio to get started
                    </p>
                    <Link
                        href="/dashboard/portfolio"
                        className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-xs text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                        Add Portfolio →
                    </Link>
                </div>
            )}
        </Card>
    );
}
