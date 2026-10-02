"use client";

import React from "react";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { APP_CHAPTERS } from "@/lib/chapters";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0 first:pt-0 last:pb-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-sm text-fg text-right min-w-0 truncate">{children}</dd>
        </div>
    );
}

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <PageHeader
                numeral={APP_CHAPTERS.settings.numeral}
                caption={APP_CHAPTERS.settings.caption} title="Settings" description="Your account details." />

            <Card>
                <CardHeader title="Profile" />
                <dl>
                    <Row label="Name">{user?.full_name || "—"}</Row>
                    <Row label="Email">{user?.email || "—"}</Row>
                    <Row label="Account">
                        <Badge tone={user?.is_active ? "positive" : "negative"} dot>
                            {user?.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </Row>
                    <Row label="Identity check">
                        {user?.kyc_verified ? (
                            <span className="inline-flex items-center gap-2">
                                <Badge tone="positive" dot>Done</Badge>
                                {user.kyc_verified_at && (
                                    <span className="text-xs text-muted">{formatDate(user.kyc_verified_at)}</span>
                                )}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-3">
                                <Badge dot>Not done</Badge>
                                <Link href={APP_CHAPTERS.identity.href} className="text-xs font-medium text-accent-text hover:underline">
                                    Do it now
                                </Link>
                            </span>
                        )}
                    </Row>
                </dl>
            </Card>

            <Card>
                <CardHeader title="How RiskLens works" />
                <dl>
                    <Row label="Market data">Daily closing prices (Yahoo Finance)</Row>
                    <Row label="Explanations">Local language model (Ollama)</Row>
                    <Row label="Identity proofs">Noir, generated in your browser</Row>
                </dl>
            </Card>
        </div>
    );
}
