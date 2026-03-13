import React from "react";
import Card from "@/components/ui/Card";

export default function AIInsightCard() {
    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    {/* AI Pulse Icon */}
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-lg bg-purple-500/20 animate-pulse" />
                        <svg className="w-4 h-4 text-purple-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white">AI Insights</h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                    GPT-4
                </div>
            </div>

            {/* Risk Level */}
            <div className="mb-5">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Risk Level</p>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm font-medium text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Moderate
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Recommendation</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                    Your portfolio is moderately diversified. Consider increasing ETF allocation
                    by <span className="text-emerald-400 font-medium">5–8%</span> to reduce
                    volatility. Crypto exposure is within acceptable limits, but set stop-losses
                    at <span className="text-amber-400 font-medium">-12%</span> for risk management.
                </p>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-xs text-gray-600">Last updated 2 hours ago</p>
                <button className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer">
                    Refresh Analysis →
                </button>
            </div>
        </Card>
    );
}
