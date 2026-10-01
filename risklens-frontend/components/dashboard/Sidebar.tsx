"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PlusCircle,
    LineChart,
    History,
    Activity,
    BadgeCheck,
    Settings,
    LogOut,
    X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import WalletButton from "@/components/dashboard/WalletButton";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const NAV = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New analysis", href: "/dashboard/portfolio", icon: PlusCircle },
    { label: "Trends & stress tests", href: "/dashboard/analytics", icon: LineChart },
    { label: "History", href: "/dashboard/history", icon: History },
    { label: "Decision patterns", href: "/dashboard/audit", icon: Activity },
];

const ACCOUNT_NAV = [
    { label: "Identity attestation", href: "/dashboard/kyc", icon: BadgeCheck },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function NavLink({
    href,
    label,
    icon: Icon,
    active,
    onNavigate,
}: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    onNavigate: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
                "flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-surface-2 text-fg font-medium" : "text-fg-2 hover:text-fg hover:bg-surface-2"
            )}
        >
            <Icon className={cn("w-4 h-4 shrink-0", active ? "text-accent" : "text-muted")} />
            {label}
        </Link>
    );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <>
            {/* Mobile scrim */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                id="app-sidebar"
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 lg:w-60 bg-surface border-r border-line flex flex-col",
                    "transition-transform lg:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Main navigation"
            >
                <div className="h-14 px-4 flex items-center justify-between border-b border-line">
                    <Logo href="/dashboard" />
                    <button
                        type="button"
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-md text-muted hover:text-fg hover:bg-surface-2"
                        aria-label="Close navigation"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                    <div className="space-y-0.5">
                        {NAV.map((item) => (
                            <NavLink key={item.href} {...item} active={isActive(item.href)} onNavigate={onClose} />
                        ))}
                    </div>
                    <div className="space-y-0.5">
                        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted">Account</p>
                        {ACCOUNT_NAV.map((item) => (
                            <NavLink key={item.href} {...item} active={isActive(item.href)} onNavigate={onClose} />
                        ))}
                    </div>
                </nav>

                <div className="px-3 pb-3">
                    <WalletButton />
                </div>

                <div className="px-3 py-3 border-t border-line flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-surface-2 text-fg-2 flex items-center justify-center text-xs font-semibold shrink-0" aria-hidden="true">
                        {(user?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg truncate">{user?.full_name || "User"}</p>
                        <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="p-1.5 rounded-md text-muted hover:text-fg hover:bg-surface-2"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </aside>
        </>
    );
}
