"use client";

import { motion } from "framer-motion";

export default function ProblemSection() {
  const blindSpots = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: "Concentration Risk",
      description: "Over-allocation to single assets can amplify losses during downturns.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      title: "Hidden Correlations",
      description: "Assets that seem diversified often move together in volatile markets.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
      title: "Diversification Gaps",
      description: "Portfolios often miss key sectors, leaving blind spots in coverage.",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="relative py-28 px-6">
      {/* Section Divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* Accent line */}
        <motion.div variants={itemAnim} className="flex justify-center mb-8">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
        </motion.div>

        <motion.h2 variants={itemAnim} className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
          Investors Track Returns
          <br />
          <span className="text-gray-500">But Rarely Understand </span>
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Risk
          </span>
        </motion.h2>

        <motion.p variants={itemAnim} className="mt-6 text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
          Most portfolio tools show performance but fail to reveal hidden risks
          like concentration, correlation, and diversification issues.
        </motion.p>

        {/* Blind Spot Cards */}
        <motion.div className="mt-16 grid sm:grid-cols-3 gap-5">
          {blindSpots.map((item) => (
            <motion.div
              variants={itemAnim}
              key={item.title}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}