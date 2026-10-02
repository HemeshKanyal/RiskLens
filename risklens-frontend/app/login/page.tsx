"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { extractError } from "@/lib/api";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import { Field, Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError("Enter your email and password.");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err) {
            setError(extractError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            caption="Bentornato"
            title="Sign in"
            description="Welcome back to RiskLens."
            footer={
                <>
                    New here?{" "}
                    <Link href="/signup" className="font-medium text-accent-text hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <Field label="Email">
                    <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                </Field>
                <Field label="Password">
                    <PasswordInput
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </Field>
                {error && (
                    <p role="alert" className="text-sm text-negative-text">
                        {error}
                    </p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    {isLoading ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthShell>
    );
}
