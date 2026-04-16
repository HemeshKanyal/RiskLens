import React from "react";
import { motion } from "framer-motion";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export default function Card({ children, className = "", delay = 0 }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl p-6 transition-colors duration-300 hover:bg-white/[0.06] hover:border-white/20 ${className}`}
        >
            {children}
        </motion.div>
    );
}
