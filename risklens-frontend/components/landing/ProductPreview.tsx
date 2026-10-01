import RiskMeter from "@/components/analysis/RiskMeter";
import HoldingsTable from "@/components/analysis/HoldingsTable";
import type { HoldingRow } from "@/lib/analysis";

// Illustrative figures in the shape RiskLens produces; not a real account.
const EXAMPLE: HoldingRow[] = [
    { symbol: "BTC", weightPct: 21.8, riskSharePct: 30.0, volatilityPct: 32.6, maxDrawdownPct: -7.0, sharpe: 2.59 },
    { symbol: "AAPL", weightPct: 28.4, riskSharePct: 21.9, volatilityPct: 27.0, maxDrawdownPct: -11.1, sharpe: 0.96 },
    { symbol: "ETH", weightPct: 8.3, riskSharePct: 15.9, volatilityPct: 45.3, maxDrawdownPct: -5.6, sharpe: 2.8 },
    { symbol: "SPY", weightPct: 13.8, riskSharePct: 5.2, volatilityPct: 11.1, maxDrawdownPct: -3.4, sharpe: 0.34 },
];

export default function ProductPreview() {
    return (
        <figure className="bg-surface border border-line rounded-xl p-5 sm:p-6 shadow-sm">
            <figcaption className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-fg">Overall risk</span>
                <span className="text-xs text-muted">Example analysis</span>
            </figcaption>
            <RiskMeter score={2.57} level="Moderate" size="sm" />
            <div className="mt-6 pt-5 border-t border-line">
                <p className="text-sm font-semibold text-fg mb-3">Where the risk comes from</p>
                <HoldingsTable holdings={EXAMPLE} />
            </div>
        </figure>
    );
}
