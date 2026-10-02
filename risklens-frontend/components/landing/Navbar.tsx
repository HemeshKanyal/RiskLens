"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Ink on parchment to match the notebook: transparent over the hero, a
 * blurred parchment bar once the hero has scrolled away.
 */
export default function Navbar() {
    const [pastHero, setPastHero] = useState(false);
    // The fade-in belongs to the page intro only; never replay it on scroll
    const [introDone, setIntroDone] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setIntroDone(true), 2200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const onScroll = () => setPastHero(window.scrollY > window.innerHeight - 64);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={cn(
                "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
                "nb-nav border-b",
                pastHero ? "nb-nav-solid" : "border-transparent",
                !introDone && !pastHero && "nb-nav-intro"
            )}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                <Logo />
                <nav className="flex items-center gap-1 sm:gap-2" aria-label="Site">
                    <a href="#allocation" className="hidden sm:inline-flex h-9 items-center px-3 text-sm opacity-80 hover:opacity-100">
                        How it works
                    </a>
                    <Link
                        href="/login"
                        className="inline-flex h-8 items-center px-3 text-xs font-medium rounded-lg hover:bg-black/5"
                    >
                        Sign in
                    </Link>
                    <Link href="/signup" className={buttonStyles({ size: "sm" })}>
                        Get started
                    </Link>
                </nav>
            </div>
        </header>
    );
}
