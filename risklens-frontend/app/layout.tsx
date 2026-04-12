import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";
import { WalletProvider } from "@/lib/wallet-context";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata = {
    title: "RiskLens",
    description: "AI-powered portfolio intelligence with blockchain proof",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="bg-[#0B0F19] text-white font-sans">
                <AuthProvider>
                    <WalletProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: "#1A2236",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "12px",
                                fontSize: "14px",
                            },
                            success: {
                                iconTheme: {
                                    primary: "#10B981",
                                    secondary: "#fff",
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: "#EF4444",
                                    secondary: "#fff",
                                },
                            },
                        }}
                    />
                    </WalletProvider>
                </AuthProvider>
            </body>
        </html>
    );
}