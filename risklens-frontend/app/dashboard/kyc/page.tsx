"use client";

import React, { useState } from "react";
import { ExternalLink, Info, Loader2 } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { Field, Input } from "@/components/ui/Field";
import { verifyKYC, confirmTx, extractError } from "@/lib/api";
import { useWallet } from "@/lib/wallet-context";
import { useAuth } from "@/lib/auth-context";
import type { KYCResponse } from "@/lib/types";
import { truncateHash, getEtherscanUrl } from "@/lib/utils";

// Demo circuit rule (zk/risklens_kyc_circuit): codes 1–3 are treated as restricted
const RESTRICTED_CODES = [1, 2, 3];

type Errors = Partial<Record<"name" | "dob" | "country" | "doc" | "form", string>>;

function ageFrom(dob: string): number | null {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const beforeBirthday = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
    if (beforeBirthday) age -= 1;
    return age;
}

export default function KYCPage() {
    const { user } = useAuth();
    const { isConnected, submitKYC } = useWallet();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [dob, setDob] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<KYCResponse | null>(null);

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

        setIsLoading(true);
        setResult(null);
        try {
            const data = await verifyKYC(
                {
                    full_name: fullName.trim(),
                    date_of_birth: dob,
                    country_code: Number(countryCode),
                    document_id: documentId.trim(),
                    age: ageFrom(dob)!,
                },
                isConnected
            );

            if (isConnected && data.zk_proof && data.public_inputs) {
                try {
                    const txHash = await submitKYC(data.zk_proof, data.public_inputs);
                    data.blockchain_tx = txHash;
                    data.blockchain_status = "confirmed";
                    data.status = "Attestation recorded on-chain from your wallet";
                    delete data.blockchain_warning;
                    await confirmTx({ tx_hash: txHash, action: "kyc_verification" });
                } catch (walletErr) {
                    data.blockchain_warning = walletErr instanceof Error ? walletErr.message : "Wallet transaction failed";
                    data.blockchain_status = "failed";
                }
            }
            setResult(data);
        } catch (err) {
            setErrors({ form: extractError(err) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <PageHeader
                title="Identity attestation"
                description="Record a hash of your identity details on the Sepolia testnet. This is a demo, not a regulated KYC check."
            />

            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent-soft">
                <Info className="w-4 h-4 text-accent-text mt-0.5 shrink-0" aria-hidden="true" />
                <div className="text-sm text-fg-2 space-y-1">
                    <p>
                        Your details are sent to the RiskLens server over HTTPS to build the proof, then discarded. Only a
                        hash of them is stored and anchored on-chain.
                    </p>
                    <p className="text-xs text-muted">Details are self-reported. No document is checked.</p>
                </div>
            </div>

            {user?.kyc_verified && !result && (
                <p className="text-sm text-fg-2">
                    <Badge tone="positive" dot>Attested</Badge> You already have an attestation. Submitting again creates a new one.
                </p>
            )}

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Full legal name" error={errors.name}>
                            <Input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
                        </Field>
                        <Field label="Date of birth" error={errors.dob}>
                            <Input type="date" autoComplete="bday" value={dob} onChange={(e) => setDob(e.target.value)} disabled={isLoading} />
                        </Field>
                        <Field label="Country code" hint="Numeric, 1–255. Codes 1–3 are a demo restricted list." error={errors.country}>
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={255}
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                disabled={isLoading}
                            />
                        </Field>
                        <Field label="Document number" hint="Passport or national ID" error={errors.doc}>
                            <Input value={documentId} onChange={(e) => setDocumentId(e.target.value)} disabled={isLoading} autoComplete="off" />
                        </Field>
                    </div>

                    {errors.form && (
                        <p role="alert" className="text-sm text-negative-text">{errors.form}</p>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                        <p className="text-xs text-muted">
                            {isConnected ? "Your wallet will be asked to sign the transaction." : "The RiskLens server submits the transaction."}
                        </p>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                            {isLoading ? "Generating proof…" : "Create attestation"}
                        </Button>
                    </div>
                </form>
            </Card>

            {result && (
                <Card aria-live="polite">
                    <CardHeader
                        title={result.status}
                        action={
                            <Badge tone={result.blockchain_status === "confirmed" ? "positive" : "warning"} dot>
                                {result.blockchain_status === "confirmed" ? "Confirmed" : "Not on-chain"}
                            </Badge>
                        }
                    />
                    <dl className="space-y-2 text-xs">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted">Identity hash</dt>
                            <dd className="font-mono text-fg-2">{truncateHash(result.identity_commitment_hash, 10)}</dd>
                        </div>
                        {result.blockchain_tx && (
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted">Transaction</dt>
                                <dd>
                                    <a
                                        href={getEtherscanUrl(result.blockchain_tx)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-mono text-accent-text hover:underline"
                                    >
                                        {truncateHash(result.blockchain_tx, 8)}
                                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                        <span className="sr-only">(view on Etherscan)</span>
                                    </a>
                                </dd>
                            </div>
                        )}
                    </dl>
                    {result.blockchain_warning && <p className="mt-3 text-xs text-warning-text">{result.blockchain_warning}</p>}
                </Card>
            )}
        </div>
    );
}
