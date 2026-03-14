"use client";

import { motion } from "framer-motion";

export default function CTASection() {
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
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-blue-500/[0.07] blur-[140px]" />
        <div className="absolute top-[30%] right-[25%] w-[350px] h-[350px] rounded-full bg-purple-500/[0.07] blur-[140px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative max-w-3xl mx-auto"
      >
        <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] p-12 md:p-16 text-center">
          {/* Badge */}
          <motion.div variants={itemAnim} className="flex justify-center mb-6">
            <span className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-400 font-medium tracking-wide">
              Get Started Today
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2 variants={itemAnim} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Start Understanding{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Portfolio
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p variants={itemAnim} className="mt-5 text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
            Create your first portfolio and discover hidden risks,
            diversification gaps, and smarter investment strategies.
          </motion.p>

          {/* Buttons */}
          <motion.div variants={itemAnim} className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="relative px-8 py-4 rounded-xl text-sm font-semibold text-white overflow-hidden group cursor-pointer">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300" />
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500/40 to-purple-600/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Get Started</span>
            </button>

            <button className="px-8 py-4 rounded-xl text-sm font-medium border border-white/[0.12] text-gray-300 hover:text-white hover:border-white/[0.25] hover:bg-white/[0.03] transition-all duration-300 cursor-pointer">
              View Demo
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
