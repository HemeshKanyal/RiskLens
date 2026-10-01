import type { HoldingRow } from "@/lib/analysis";

function fmtPct(v: number | undefined, digits = 1) {
    return v === undefined ? "—" : `${v.toFixed(digits)}%`;
}

/**
 * Share of value vs share of risk per holding. The gray bar is the weight,
 * the accent bar is the risk contribution: a holding whose accent bar is
 * longer than its gray bar adds more risk than its size suggests.
 */
export default function HoldingsTable({ holdings }: { holdings: HoldingRow[] }) {
    const hasRisk = holdings.some((h) => h.riskSharePct !== undefined);
    const max = Math.max(1, ...holdings.flatMap((h) => [h.weightPct, h.riskSharePct ?? 0]));

    return (
        <div>
            {hasRisk && (
                <div className="flex items-center gap-4 mb-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-sm bg-series-muted" aria-hidden="true" /> Share of value
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-sm bg-accent" aria-hidden="true" /> Share of risk
                    </span>
                </div>
            )}
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-muted border-b border-line">
                        <th scope="col" className="py-2 pr-3 font-medium">Holding</th>
                        <th scope="col" className="py-2 pr-3 font-medium w-[72%] sm:w-[40%]">
                            {hasRisk ? "Value vs risk" : "Share of value"}
                        </th>
                        <th scope="col" className="py-2 pr-3 font-medium text-right hidden sm:table-cell">Volatility</th>
                        <th scope="col" className="py-2 pr-3 font-medium text-right hidden md:table-cell">Max drawdown</th>
                        <th scope="col" className="py-2 font-medium text-right hidden md:table-cell">Sharpe</th>
                    </tr>
                </thead>
                <tbody>
                    {holdings.map((h) => {
                        const excess = h.riskSharePct !== undefined ? h.riskSharePct - h.weightPct : 0;
                        return (
                            <tr key={h.symbol} className="border-b border-line last:border-0">
                                <th scope="row" className="py-3 pr-3 text-left font-medium text-fg font-mono text-[13px]">
                                    {h.symbol}
                                </th>
                                <td className="py-3 pr-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5">
                                                <div className="h-full rounded-r bg-series-muted" style={{ width: `${(h.weightPct / max) * 100}%` }} />
                                            </div>
                                            <span className="w-12 text-right text-xs text-fg-2 tabular-nums">{fmtPct(h.weightPct)}</span>
                                        </div>
                                        {h.riskSharePct !== undefined && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5">
                                                    <div className="h-full rounded-r bg-accent" style={{ width: `${(h.riskSharePct / max) * 100}%` }} />
                                                </div>
                                                <span className="w-12 text-right text-xs text-fg tabular-nums">{fmtPct(h.riskSharePct)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {excess >= 5 && (
                                        <p className="mt-1 text-[11px] text-warning-text">
                                            Adds {excess.toFixed(0)} pts more risk than its size
                                        </p>
                                    )}
                                </td>
                                <td className="py-3 pr-3 text-right tabular-nums text-fg-2 hidden sm:table-cell">{fmtPct(h.volatilityPct)}</td>
                                <td className="py-3 pr-3 text-right tabular-nums text-fg-2 hidden md:table-cell">{fmtPct(h.maxDrawdownPct)}</td>
                                <td className="py-3 text-right tabular-nums text-fg-2 hidden md:table-cell">
                                    {h.sharpe === undefined ? "—" : h.sharpe.toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {hasRisk && (
                <p className="mt-3 text-xs text-muted">
                    Volatility is annualised over the lookback window. Share of risk is each holding&apos;s
                    contribution to total portfolio volatility.
                </p>
            )}
        </div>
    );
}
