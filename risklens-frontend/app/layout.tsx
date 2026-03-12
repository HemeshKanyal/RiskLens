import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata = {
    title: "RiskLens",
    description: "AI-powered portfolio intelligence",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="bg-[#0B0F19] text-white font-sans">
                {children}
            </body>
        </html>
    );
}