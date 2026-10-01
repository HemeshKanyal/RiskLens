"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/dashboard/Sidebar";
import Logo from "@/components/ui/Logo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [navOpen, setNavOpen] = useState(false);
    const closeNav = useCallback(() => setNavOpen(false), []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push("/login");
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center" role="status">
                <Loader2 className="w-5 h-5 text-muted animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen lg:pl-60">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-md focus:bg-surface focus:text-fg"
            >
                Skip to content
            </a>
            <Sidebar open={navOpen} onClose={closeNav} />

            <header className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center gap-3 bg-surface/90 backdrop-blur border-b border-line">
                <button
                    type="button"
                    onClick={() => setNavOpen(true)}
                    className="p-1.5 -ml-1.5 rounded-md text-fg-2 hover:bg-surface-2"
                    aria-label="Open navigation"
                    aria-controls="app-sidebar"
                    aria-expanded={navOpen}
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Logo href="/dashboard" />
            </header>

            <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {children}
            </main>
        </div>
    );
}
