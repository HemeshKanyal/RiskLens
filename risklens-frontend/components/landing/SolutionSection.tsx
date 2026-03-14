"use client";

import { motion } from "framer-motion";

export default function SolutionSection() {
  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      title: "Risk Analysis",
      description:
        "Understand exposure, volatility, and downside risk in your portfolio.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      ),
      title: "Diversification Score",
      description:
        "See how diversified your portfolio really is across sectors and assets.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
          <path d="M12 3v3m6.36-.64l-2.12 2.12M21 12h-3M18.36 18.36l-2.12-2.12M12 21v-3M7.76 18.36l-2.12-2.12M3 12h3M5.64 5.64l2.12 2.12" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
      title: "AI Rebalancing",
      description:
        "Get explainable suggestions to improve your portfolio allocation.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      title: "Portfolio Health",
      description:
        "Track a single health score summarizing your portfolio stability.",
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
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

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
              Platform
            </span>
          </motion.div>

          <motion.h2 variants={itemAnim} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Meet{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              RiskLens
            </span>
          </motion.h2>

          <motion.p variants={itemAnim} className="mt-5 text-gray-400 text-lg leading-relaxed">
            Powerful analytics that reveal hidden portfolio risks and help
            investors make smarter decisions.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => (
            <motion.div
              variants={itemAnim}
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out"
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Text */}
              <h3 className="text-[15px] font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
