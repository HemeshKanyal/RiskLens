"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { extractError } from "@/lib/api";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Please enter both email and password");
            return;
        }

        setIsLoading(true);
        try {
            await login(email.trim(), password);
            toast.success("Welcome back!");
        } catch (err) {
            toast.error(extractError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D111A] px-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            {/* RiskLens Logo */}
            <Link href="/" className="flex items-center gap-3 mb-10 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                    R
                </div>
                <span className="text-2xl font-semibold tracking-tight text-white">
                    RiskLens
                </span>
            </Link>

            <form
                onSubmit={handleLogin}
                className="relative z-10 bg-[#1A2236]/80 backdrop-blur-xl p-10 rounded-2xl w-full max-w-[420px] shadow-2xl border border-white/[0.06]"
            >
                <h1 className="text-2xl font-bold text-center mb-2">
                    Welcome back
                </h1>
                <p className="text-sm text-gray-500 text-center mb-8">
                    Sign in to your RiskLens account
                </p>

                {/* Email */}
                <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                        Email
                    </label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                    />
                </div>

                {/* Password */}
                <div className="mb-8">
                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50 pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </button>

                <p className="text-sm text-center mt-6 text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        Create account
                    </Link>
                </p>
            </form>
        </div>
    );
}