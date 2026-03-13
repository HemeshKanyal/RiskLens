import Sidebar from "@/components/dashboard/Sidebar";

export const metadata = {
    title: "Dashboard — RiskLens",
    description: "AI-powered portfolio intelligence dashboard",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0B0F19]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">{children}</main>
        </div>
    );
}
