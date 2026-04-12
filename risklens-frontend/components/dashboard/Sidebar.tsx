"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import WalletButton from "@/components/dashboard/WalletButton";
import {
    LayoutDashboard,
    Briefcase,
    BarChart3,
    ShieldCheck,
    History,
    Settings,
    LogOut,
    Activity,
} from "lucide-react";

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Portfolio",
        href: "/dashboard/portfolio",
        icon: Briefcase,
    },
    {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
    },
    {
        label: "KYC",
        href: "/dashboard/kyc",
        icon: ShieldCheck,
    },
    {
        label: "History",
        href: "/dashboard/history",
        icon: History,
    },
    {
        label: "Audit",
        href: "/dashboard/audit",
        icon: Activity,
    },
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const getInitial = () => {
        if (!user?.full_name) return "U";
        return user.full_name.charAt(0).toUpperCase();
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-[#0d1117] border-r border-white/[0.06] flex flex-col z-50">
            {/* Logo */}
            <div className="px-6 py-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25">
                    R
                </div>
                <span className="text-lg font-semibold tracking-tight">RiskLens</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 mt-2 space-y-1">
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                                isActive
                                    ? "bg-white/[0.06] text-white"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                            }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-500" />
                            )}
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Wallet */}
            <div className="px-4 pb-3">
                <WalletButton />
            </div>

            {/* User */}
            <div className="px-4 py-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                        {getInitial()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.full_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.email || ""}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
