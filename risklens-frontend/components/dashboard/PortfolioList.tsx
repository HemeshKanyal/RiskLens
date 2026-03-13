import React from "react";
import Card from "@/components/ui/Card";

const portfolios = [
    {
        name: "Growth Portfolio",
        value: "$524,300",
        change: "+4.2%",
        changeType: "positive" as const,
        assets: 12,
        color: "#3B82F6",
    },
    {
        name: "Crypto Alpha",
        value: "$312,150",
        change: "+12.8%",
        changeType: "positive" as const,
        assets: 8,
        color: "#A855F7",
    },
    {
        name: "ETF Balanced",
        value: "$285,470",
        change: "-1.3%",
        changeType: "negative" as const,
        assets: 15,
        color: "#06B6D4",
    },
    {
        name: "Commodity Hedge",
        value: "$102,600",
        change: "+2.1%",
        changeType: "positive" as const,
        assets: 5,
        color: "#F59E0B",
    },
    {
        name: "Retirement Fund",
        value: "$60,000",
        change: "+0.7%",
        changeType: "positive" as const,
        assets: 10,
        color: "#10B981",
    },
];

export default function PortfolioList() {
    return (
        <Card>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-semibold text-white">Your Portfolios</h3>
                    <p className="text-xs text-gray-500 mt-1">{portfolios.length} active portfolios</p>
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer">
                    View All →
                </button>
            </div>

            <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                    <span className="col-span-5">Portfolio</span>
                    <span className="col-span-3 text-right">Value</span>
                    <span className="col-span-2 text-right">Change</span>
                    <span className="col-span-2 text-right">Assets</span>
                </div>

                {/* Rows */}
                {portfolios.map((portfolio) => (
                    <div
                        key={portfolio.name}
                        className="grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer group"
                    >
                        <div className="col-span-5 flex items-center gap-3">
                            <div
                                className="w-2 h-8 rounded-full shrink-0"
                                style={{ backgroundColor: portfolio.color }}
                            />
                            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                {portfolio.name}
                            </span>
                        </div>
                        <span className="col-span-3 text-right text-sm font-medium text-white">
                            {portfolio.value}
                        </span>
                        <span
                            className={`col-span-2 text-right text-sm font-medium ${
                                portfolio.changeType === "positive"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                            }`}
                        >
                            {portfolio.change}
                        </span>
                        <span className="col-span-2 text-right text-sm text-gray-400">
                            {portfolio.assets}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
