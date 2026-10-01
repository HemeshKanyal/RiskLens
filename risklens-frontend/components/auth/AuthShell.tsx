import React from "react";
import Logo from "@/components/ui/Logo";

export default function AuthShell({
    title,
    description,
    footer,
    children,
}: {
    title: string;
    description: string;
    footer: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="mb-8">
                    <Logo />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
                <p className="mt-1 text-sm text-muted">{description}</p>
                <div className="mt-8">{children}</div>
                <p className="mt-6 text-sm text-muted">{footer}</p>
            </div>
        </div>
    );
}
