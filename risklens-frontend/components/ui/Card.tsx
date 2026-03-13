import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
    return (
        <div
            className={`bg-[#111827]/60 border border-white/[0.06] rounded-2xl backdrop-blur-sm p-6 ${className}`}
        >
            {children}
        </div>
    );
}
