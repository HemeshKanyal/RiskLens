"use client";

import { motion } from "framer-motion";

export default function BlockchainVerificationSection() {
  const bullets = [
    { label: "Tamper-proof portfolio snapshots", color: "bg-blue-400" },
    { label: "Blockchain-backed verification", color: "bg-purple-400" },
    { label: "Transparent historical analytics", color: "bg-cyan-400" },
    { label: "Cryptographic proof of portfolio history", color: "bg-emerald-400" },
  ];

  const steps = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
      title: "Portfolio Snapshot",
      subtitle: "Capture current state",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 3h-8l-2 4h12l-2-4z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
      title: "Proof Generated",
      subtitle: "Cryptographic hash created",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <path d="M1 10h22" />
          <path d="M7.5 4v16M16.5 4v16" />
        </svg>
      ),
      title: "Stored On Chain",
      subtitle: "Immutable record saved",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: "Verified Anytime",
      subtitle: "Transparent & trustless",
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

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[40%] left-[20%] w-[350px] h-[350px] rounded-full bg-blue-500/[0.05] blur-[120px]" />
        <div className="absolute bottom-[30%] right-[15%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.05] blur-[120px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div variants={itemAnim} className="flex justify-center mb-6">
            <span className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-400 font-medium tracking-wide">
              Trust Layer
            </span>
          </motion.div>

          <motion.h2 variants={itemAnim} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Verified Portfolio{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </motion.h2>

          <motion.p variants={itemAnim} className="mt-5 text-gray-400 text-lg leading-relaxed">
            RiskLens combines AI analytics with blockchain verification to
            ensure portfolio insights remain transparent and tamper-proof.
          </motion.p>
        </div>

        {/* Two Column */}
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left — Text */}
          <motion.div variants={itemAnim}>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
              Trust Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Portfolio Data
              </span>
            </h3>

            <p className="mt-5 text-gray-400 leading-relaxed">
              RiskLens stores portfolio snapshots and risk insights as
              verifiable proofs so analytics remain transparent and
              tamper-proof.
            </p>

            <ul className="mt-8 space-y-4">
              {bullets.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Step Flow */}
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <motion.div variants={itemAnim} key={step.title}>
                {/* Card */}
                <div className="group flex items-center gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/40 hover:-translate-y-[6px] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 ease-in-out">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>
                  <span className="ml-auto text-[11px] font-mono text-gray-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Connector */}
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-gradient-to-b from-white/[0.1] to-transparent" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
