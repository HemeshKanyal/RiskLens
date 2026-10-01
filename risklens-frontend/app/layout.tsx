import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: { default: "RiskLens", template: "%s · RiskLens" },
    description: "Portfolio risk and diversification analysis in plain language",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
        { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <body>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: "var(--surface)",
                                color: "var(--fg)",
                                border: "1px solid var(--line-strong)",
                                borderRadius: "10px",
                                fontSize: "14px",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                            },
                            success: { iconTheme: { primary: "var(--positive)", secondary: "var(--surface)" } },
                            error: { iconTheme: { primary: "var(--negative)", secondary: "var(--surface)" } },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
