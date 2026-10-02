"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { APP_CHAPTERS } from "@/lib/chapters";
import { Field, Input } from "@/components/ui/Field";
import { verifyKYC, extractError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createIdentityProof, IdentityProofError } from "@/lib/zk-identity";
import type { KYCResponse } from "@/lib/types";
import { formatDate, truncateHash } from "@/lib/utils";

// Demo rule enforced by the circuit (zk/risklens_kyc_circuit)
const RESTRICTED_CODES = [1, 2, 3];

type Errors = Partial<Record<"name" | "dob" | "country" | "doc" | "form", string>>;
type Phase = "idle" | "loading" | "proving" | "verifying";

const PHASE_LABEL: Record<Exclude<Phase, "idle">, string> = {
    loading: "Loading prover…",
    proving: "Creating proof on this device…",
    verifying: "Verifying proof…",
};

function ageFrom(dob: string): number | null {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age -= 1;
    return age;
}

export default function KYCPage() {
    const { user, refreshUser } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [dob, setDob] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [phase, setPhase] = useState<Phase>("idle");
    const [result, setResult] = useState<KYCResponse | null>(null);
    const isBusy = phase !== "idle";
    // Done before this visit: a just-finished check still shows its result below
    const alreadyDone = !!user?.kyc_verified && !result && phase === "idle";

    // Same checks as the circuit, so most mistakes are caught before proving
    const validate = (): Errors => {
        const e: Errors = {};
        if (fullName.trim().length < 2) e.name = "Enter your full name.";
        const age = ageFrom(dob);
        if (age === null) e.dob = "Enter your date of birth.";
        else if (age < 18) e.dob = "You must be 18 or older.";
        else if (age > 120) e.dob = "Check the year.";
        const code = Number(countryCode);
        if (!Number.isInteger(code) || code < 1 || code > 255) e.country = "Enter a number from 1 to 255.";
        else if (RESTRICTED_CODES.includes(code)) e.country = "This code is on the demo restricted list.";
        if (documentId.trim().length < 4) e.doc = "Enter at least 4 characters.";
        return e;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setResult(null);
        try {
            const proof = await createIdentityProof(
                { fullName, dateOfBirth: dob, countryCode: Number(countryCode), documentId },
                setPhase
            );
            setPhase("verifying");
            setResult(await verifyKYC(proof.request));
            await refreshUser();
        } catch (err) {
            setErrors({
                form: err instanceof IdentityProofError ? err.message : extractError(err),
            });
        } finally {
            setPhase("idle");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <PageHeader
                numeral={APP_CHAPTERS.identity.numeral}
                caption={APP_CHAPTERS.identity.caption}
                title="Identity check"
                description="Prove you're 18+ and not from a restricted country, without sharing your details."
            />

            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent-soft">
                <Lock className="w-4 h-4 text-accent-text mt-0.5 shrink-0" aria-hidden="true" />
                <div className="text-sm text-fg-2 space-y-1">
                    <p>
                        Your details stay on this device. Your browser creates a zero-knowledge proof from them, and
                        RiskLens only receives the proof and a salted fingerprint of your details, which it can&apos;t
                        reverse.
                    </p>
                    <p className="text-xs text-muted">
                        This is a demo: details are self-reported and no document is checked, so it isn&apos;t a
                        regulated KYC.
                    </p>
                </div>
            </div>

            {alreadyDone ? (
                <Card>
                    <CardHeader
                        title={
                            <span className="inline-flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-positive-text" aria-hidden="true" />
                                Your identity check is done
                            </span>
                        }
                        description={
                            user?.kyc_verified_at
                                ? `Verified on ${formatDate(user.kyc_verified_at)}. You don't need to do it again.`
                                : "You don't need to do it again."
                        }
                    />
                    <Link href={APP_CHAPTERS.settings.href} className="text-sm font-medium text-accent-text hover:underline">
                        See it in Settings
                    </Link>
                </Card>
            ) : (
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Full legal name" error={errors.name}>
                                <Input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isBusy} />
                            </Field>
                            <Field label="Date of birth" error={errors.dob}>
                                <Input type="date" autoComplete="bday" value={dob} onChange={(e) => setDob(e.target.value)} disabled={isBusy} />
                            </Field>
                            <Field label="Country code" hint="Numeric, 1–255. Codes 1–3 are a demo restricted list." error={errors.country}>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={255}
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    disabled={isBusy}
                                />
                            </Field>
                            <Field label="Document number" hint="Passport or national ID" error={errors.doc}>
                                <Input value={documentId} onChange={(e) => setDocumentId(e.target.value)} disabled={isBusy} autoComplete="off" />
                            </Field>
                        </div>

                        {errors.form && (
                            <p role="alert" className="text-sm text-negative-text">{errors.form}</p>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                            <p className="text-xs text-muted" aria-live="polite">
                                {isBusy ? PHASE_LABEL[phase as Exclude<Phase, "idle">] : "Takes a few seconds the first time while the prover loads."}
                            </p>
                            <Button type="submit" disabled={isBusy}>
                                {isBusy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                                {isBusy ? "Working…" : "Create proof"}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {result && (
                <Card aria-live="polite">
                    <CardHeader
                        title={
                            <span className="inline-flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-positive-text" aria-hidden="true" />
                                Identity proof verified
                            </span>
                        }
                        description="The server checked your proof. Your details were never sent."
                    />
                    <dl className="space-y-2 text-xs">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted">Fingerprint (salted commitment)</dt>
                            <dd className="font-mono text-fg-2" title={result.identity_commitment_hash}>
                                {truncateHash(result.identity_commitment_hash, 10)}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted">Verified</dt>
                            <dd className="text-fg-2">{formatDate(result.verified_at)}</dd>
                        </div>
                    </dl>
                </Card>
            )}
        </div>
    );
}
