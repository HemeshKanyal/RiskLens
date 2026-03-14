"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const allocationData = [
  { name: "BTC", value: 40 },
  { name: "ETH", value: 25 },
  { name: "SOL", value: 15 },
  { name: "USDC", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = ["#3B82F6", "#8B5CF6", "#06B6D4", "#22C55E", "#6366F1"];

export default function HeroSection() {
  const floatAnim = {
    y: [-8, 8, -8],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  return (
    <section className="relative pt-36 pb-28 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.12] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.12] blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/[0.06] blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Left — Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium tracking-wide">
              AI-Powered Analytics
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.1] tracking-tight">
            Track Risk.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              Understand Your Portfolio.
            </span>
          </h1>

          <p className="mt-6 text-gray-400 text-lg leading-relaxed max-w-md">
            AI-powered portfolio intelligence platform that analyzes risk,
            diversification, and portfolio health.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button className="relative px-7 py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden group cursor-pointer">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300" />
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500/40 to-purple-600/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Get Started</span>
            </button>

            <button className="px-7 py-3.5 rounded-xl text-sm font-medium border border-white/[0.1] text-gray-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.03] transition-all duration-300 cursor-pointer">
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Right — Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative flex justify-center md:justify-end"
        >
          <div className="relative w-[380px] h-[340px] md:w-[420px] md:h-[370px]">
            {/* Portfolio Value Card */}
            <motion.div
              animate={floatAnim}
              className="absolute -top-4 left-0 w-[200px] p-5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/30 z-20 hover:-translate-y-1 transition-transform duration-500"
            >
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Portfolio Value
              </p>
              <p className="text-2xl font-bold mt-2 tracking-tight">
                $124,560
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-emerald-400"
                >
                  <path
                    d="M6 2L10 7H2L6 2Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-emerald-400 text-sm font-semibold">
                  +3.2%
                </span>
                <span className="text-gray-600 text-xs ml-1">24h</span>
              </div>
            </motion.div>

            {/* Allocation Chart Card */}
            <motion.div
              animate={{
                ...floatAnim,
                transition: { ...floatAnim.transition, duration: 6, delay: 1.5 },
              }}
              className="absolute top-14 right-0 w-[260px] p-5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/30 z-10 hover:-translate-y-1 transition-transform duration-500"
            >
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                Asset Allocation
              </p>
              <div className="flex items-center gap-4">
                <div className="w-[100px] h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={46}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {allocationData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5">
                  {allocationData.slice(0, 4).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      <span className="text-[11px] text-gray-400">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-gray-500 ml-auto">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Risk Level Card */}
            <motion.div
              animate={{
                ...floatAnim,
                transition: { ...floatAnim.transition, duration: 5.5, delay: 0.8 },
              }}
              className="absolute bottom-2 left-4 w-[185px] p-5 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/30 z-20 hover:-translate-y-1 transition-transform duration-500"
            >
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Risk Level
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="url(#riskGradient)"
                      strokeWidth="3"
                      strokeDasharray="88"
                      strokeDashoffset="35"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="riskGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#EF4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-amber-400">
                    Medium
                  </p>
                  <p className="text-[11px] text-gray-500">Score: 62/100</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}