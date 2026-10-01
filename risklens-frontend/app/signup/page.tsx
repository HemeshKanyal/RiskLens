"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { extractError } from "@/lib/api";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import { Field, Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "form", string>>;

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const validate = (): Errors => {
        const e: Errors = {};
        if (name.trim().length < 2) e.name = "Enter at least 2 characters.";
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
        if (password.length < 8) e.password = "Use at least 8 characters.";
        else if (new TextEncoder().encode(password).length > 72) e.password = "Use at most 72 characters.";
        if (confirm !== password) e.confirm = "Passwords don't match.";
        return e;
    };

    const handleSignup = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setIsLoading(true);
        try {
            await register({ email: email.trim(), password, full_name: name.trim() });
            toast.success("Account created. Sign in to continue.");
        } catch (err) {
            setErrors({ form: extractError(err) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            title="Create your account"
            description="Analyze portfolio risk in a couple of minutes."
            footer={
                <>
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-accent-text hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
                <Field label="Full name" error={errors.name}>
                    <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                </Field>
                <Field label="Email" error={errors.email}>
                    <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                </Field>
                <Field label="Password" hint="At least 8 characters" error={errors.password}>
                    <PasswordInput
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </Field>
                <Field label="Confirm password" error={errors.confirm}>
                    <PasswordInput
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={isLoading}
                    />
                </Field>
                {errors.form && (
                    <p role="alert" className="text-sm text-negative-text">
                        {errors.form}
                    </p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    {isLoading ? "Creating account…" : "Create account"}
                </Button>
            </form>
        </AuthShell>
    );
}
