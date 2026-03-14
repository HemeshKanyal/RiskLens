"use client";

import { motion } from "framer-motion";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
          <path d="M14 2v6a2 2 0 0 0 2 2h6" />
          <path d="M12 18v-6" />
          <path d="M9 15h6" />
        </svg>
      ),
      title: "Create Portfolio",
      description:
        "Create a portfolio and organize your investments across stocks, crypto, ETFs, and other assets.",
    },
    {
      step: "02",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      title: "Add Your Assets",
      description:
        "Manually add assets or import your holdings to build a complete view of your portfolio.",
    },
    {
      step: "03",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M12 22V12" />
          <path d="M3.27 6.96L12 12l8.73-5.04" />
        </svg>
      ),
      title: "Analyze Risk",
      description:
        "RiskLens analyzes correlations, diversification, and concentration risks using AI models.",
    },
    {
      step: "04",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: "Verify Portfolio",
      description:
        "Portfolio snapshots can be verified using blockchain-based proof of history.",
    },
  ];

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
      {/* Section Divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div variants={itemAnim} className="flex justify-center mb-6">
            <span className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-400 font-medium tracking-wide">
              Workflow
            </span>
          </motion.div>

          <motion.h2 variants={itemAnim} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            How{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              RiskLens
            </span>{" "}
            Works
          </motion.h2>

          <motion.p variants={itemAnim} className="mt-5 text-gray-400 text-lg leading-relaxed">
            From portfolio tracking to AI-powered insights — understand your
            investments in minutes.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <motion.div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Connector line — desktop only */}
          <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20" />

          {steps.map((step) => (
            <motion.div
              variants={itemAnim}
              key={step.step}
              className="group relative p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out"
            >
              {/* Step number */}
              <span className="absolute top-4 right-5 text-[11px] font-mono text-gray-600">
                {step.step}
              </span>

              {/* Icon */}
              <div className="relative z-10 w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </div>

              {/* Text */}
              <h3 className="text-[15px] font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
