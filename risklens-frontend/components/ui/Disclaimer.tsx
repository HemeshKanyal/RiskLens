import { Info } from "lucide-react";

export const DISCLAIMER =
    "RiskLens is an educational tool, not investment advice. Scores are model estimates based on historical prices and can be wrong.";

export default function Disclaimer({ asOf }: { asOf?: string }) {
    return (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-line">
            <Info className="w-4 h-4 text-muted mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-muted leading-relaxed">
                {asOf && <>Prices and metrics as of {asOf}. </>}
                {DISCLAIMER}
            </p>
        </div>
    );
}
