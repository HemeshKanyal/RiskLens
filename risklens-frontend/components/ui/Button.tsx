import React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
    primary: "bg-accent-solid text-on-accent hover:bg-accent-solid-hover",
    secondary: "border border-line-strong text-fg hover:bg-surface-2",
    ghost: "text-fg-2 hover:text-fg hover:bg-surface-2",
    danger: "border border-line-strong text-negative-text hover:bg-negative-soft",
};

const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-sm gap-2",
};

export function buttonStyles({
    variant = "primary",
    size = "md",
    className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
    return cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
    );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

export default function Button({
    variant,
    size,
    className,
    type = "button",
    ...props
}: ButtonProps) {
    return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
