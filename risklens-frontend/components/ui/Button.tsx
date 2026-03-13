import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    children: React.ReactNode;
}

const variants = {
    primary:
        "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/20",
    secondary:
        "bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-white",
    ghost: "hover:bg-white/[0.06] text-gray-400 hover:text-white",
};

export default function Button({
    variant = "primary",
    children,
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
