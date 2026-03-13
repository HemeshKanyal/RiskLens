import MetricCard from "@/components/dashboard/MetricCard";
import AllocationChart from "@/components/dashboard/AllocationChart";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import PortfolioList from "@/components/dashboard/PortfolioList";

export default function DashboardPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Your portfolio overview and AI insights
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Markets Open
                    </div>
                </div>
            </div>

            {/* Top Row: Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <MetricCard
                    label="Total Portfolio Value"
                    value="$1,284,520"
                    change="+5.4% from last month"
                    changeType="positive"
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Total Profit / Loss"
                    value="+$42,380"
                    change="+3.4% this quarter"
                    changeType="positive"
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Portfolio Health Score"
                    value="87 / 100"
                    change="Strong — well diversified"
                    changeType="neutral"
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                    }
                />
            </div>

            {/* Middle Row: Chart + AI Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AllocationChart />
                <AIInsightCard />
            </div>

            {/* Bottom Row: Portfolio List */}
            <PortfolioList />
        </div>
    );
}
