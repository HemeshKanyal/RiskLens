import React from "react";
import Logo from "@/components/ui/Logo";
import Construction from "@/components/ui/Construction";

export default function AuthShell({
    title,
    caption,
    description,
    footer,
    children,
}: {
    title: string;
    caption: string;
    description: string;
    footer: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-12">
            <Construction />
            <div className="relative w-full max-w-md">
                <div className="mb-6 flex justify-center">
                    <Logo />
                </div>
                <div className="border border-fg/60 bg-surface/80 backdrop-blur-[2px] rounded-sm p-7 sm:p-9 shadow-[0_1px_0_var(--line)]">
                    <p className="font-fell italic text-lg text-accent-text">{caption}</p>
                    <h1 className="mt-1 text-4xl font-bold tracking-[-0.04em] leading-none text-fg">{title}</h1>
                    <p className="mt-2 font-serif text-lg leading-snug text-fg-2">{description}</p>
                    <div className="mt-7">{children}</div>
                </div>
                <p className="mt-6 text-center text-sm text-muted">{footer}</p>
            </div>
        </div>
    );
}
