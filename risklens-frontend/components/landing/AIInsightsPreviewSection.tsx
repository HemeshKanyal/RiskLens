"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const allocationData = [
  { name: "BTC", value: 40 },
  { name: "ETH", value: 25 },
  { name: "SOL", value: 15 },
  { name: "USDC", value: 20 },
];

const COLORS = ["#3B82F6", "#8B5CF6", "#06B6D4", "#22C55E"];

export default function AIInsightsPreviewSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="relative py-28 px-6">
      {/* Top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.06] blur-[120px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-blue-500/[0.06] blur-[120px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative max-w-6xl mx-auto"
      >
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div variants={itemAnim} className="flex justify-center mb-6">
            <span className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-400 font-medium tracking-wide">
              Dashboard Preview
            </span>
          </motion.div>

          <motion.h2 variants={itemAnim} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Portfolio Insights
            </span>
          </motion.h2>

          <motion.p variants={itemAnim} className="mt-5 text-gray-400 text-lg leading-relaxed">
            Advanced analytics reveal hidden risks, diversification gaps, and
            smarter portfolio strategies.
          </motion.p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left — Text */}
          <motion.div variants={itemAnim}>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
              AI-Powered Portfolio{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h3>

            <p className="mt-5 text-gray-400 leading-relaxed">
              RiskLens analyzes your portfolio using advanced risk models to
              uncover hidden correlations, diversification gaps, and potential
              vulnerabilities.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { label: "Risk Score", color: "bg-blue-400" },
                { label: "Diversification Analysis", color: "bg-purple-400" },
                { label: "Asset Allocation Insights", color: "bg-cyan-400" },
                { label: "AI Rebalancing Suggestions", color: "bg-emerald-400" },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Dashboard Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Risk Score Card */}
            <motion.div variants={itemAnim} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                Risk Score
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="rgba(255,255,255,0.06)" strokeWidth="3"
                    />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="url(#riskGrad)" strokeWidth="3"
                      strokeDasharray="88" strokeDashoffset="33"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#EF4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    62
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-400">Medium Risk</p>
                  <p className="text-[11px] text-gray-500">62 / 100</p>
                </div>
              </div>
            </motion.div>

            {/* Diversification Score Card */}
            <motion.div variants={itemAnim} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                Diversification
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                74%
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Well diversified across sectors.
              </p>
            </motion.div>

            {/* Asset Allocation Card */}
            <motion.div variants={itemAnim} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                Asset Allocation
              </p>
              <div className="flex items-center gap-3">
                <div className="w-[72px] h-[72px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={34}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {allocationData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1">
                  {allocationData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      <span className="text-[11px] text-gray-400">{item.name}</span>
                      <span className="text-[11px] text-gray-500 ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* AI Recommendation Card */}
            <motion.div variants={itemAnim} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                AI Recommendation
              </p>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <path d="M12 3v3m6.36-.64l-2.12 2.12M21 12h-3M18.36 18.36l-2.12-2.12M12 21v-3M7.76 18.36l-2.12-2.12M3 12h3M5.64 5.64l2.12 2.12" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Reduce BTC exposure by 5% and increase ETF allocation for
                  better diversification.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
