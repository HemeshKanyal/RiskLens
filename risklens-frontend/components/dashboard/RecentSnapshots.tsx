import Link from "next/link";
import Card, { CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import type { PortfolioSnapshot } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function snapshotValue(p: PortfolioSnapshot) {
    return p.assets.reduce((sum, a) => sum + (a.value || 0), 0);
}

export default function RecentSnapshots({
    portfolios,
    isLoading,
}: {
    portfolios: PortfolioSnapshot[];
    isLoading?: boolean;
}) {
    return (
        <Card padded={false}>
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                <CardHeader
                    title="Recent snapshots"
                    description="Each analysis saves the holdings you entered at that time."
                    action={
                        <Link href="/dashboard/history" className="text-xs font-medium text-accent-text hover:underline">
                            View history
                        </Link>
                    }
                    className="mb-3"
                />
            </div>

            {isLoading ? (
                <div className="px-5 pb-5 sm:px-6 space-y-2">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-muted border-y border-line">
                                <th scope="col" className="py-2 pl-5 sm:pl-6 pr-3 font-medium">Date</th>
                                <th scope="col" className="py-2 pr-3 font-medium hidden sm:table-cell">Profile</th>
                                <th scope="col" className="py-2 pr-3 font-medium text-right">Holdings</th>
                                <th scope="col" className="py-2 pr-5 sm:pr-6 font-medium text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolios.slice(0, 5).map((p) => (
                                <tr key={p.snapshot_hash} className="border-b border-line last:border-0">
                                    <td className="py-3 pl-5 sm:pl-6 pr-3 text-fg whitespace-nowrap">{formatDate(p.created_at)}</td>
                                    <td className="py-3 pr-3 text-fg-2 capitalize hidden sm:table-cell">{p.risk_profile}</td>
                                    <td className="py-3 pr-3 text-right tabular-nums text-fg-2">{p.assets.length}</td>
                                    <td className="py-3 pr-5 sm:pr-6 text-right tabular-nums text-fg whitespace-nowrap">{formatCurrency(snapshotValue(p))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
