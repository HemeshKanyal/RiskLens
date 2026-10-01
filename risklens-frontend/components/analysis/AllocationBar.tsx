import { ASSET_CLASSES, assetClassLabel, getAssetTypeColor } from "@/lib/utils";

/**
 * Part-to-whole by asset class: one stacked bar with surface gaps between
 * segments, plus a legend that always carries the label and percentage
 * (identity never relies on color alone).
 */
export default function AllocationBar({ weights }: { weights: Record<string, number> }) {
    const entries = Object.entries(weights)
        .filter(([, v]) => v > 0)
        .sort(
            ([a], [b]) =>
                ASSET_CLASSES.indexOf(a as (typeof ASSET_CLASSES)[number]) -
                ASSET_CLASSES.indexOf(b as (typeof ASSET_CLASSES)[number])
        );
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

    return (
        <div>
            <div className="flex h-3 gap-[2px]" role="img" aria-label={entries.map(([k, v]) => `${assetClassLabel(k)} ${v.toFixed(1)}%`).join(", ")}>
                {entries.map(([cls, v], i) => (
                    <div
                        key={cls}
                        title={`${assetClassLabel(cls)}: ${v.toFixed(1)}%`}
                        className={[
                            "h-full",
                            i === 0 ? "rounded-l" : "",
                            i === entries.length - 1 ? "rounded-r" : "",
                        ].join(" ")}
                        style={{ width: `${(v / total) * 100}%`, backgroundColor: getAssetTypeColor(cls) }}
                    />
                ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                {entries.map(([cls, v]) => (
                    <li key={cls} className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: getAssetTypeColor(cls) }} aria-hidden="true" />
                        <span className="text-fg-2">{assetClassLabel(cls)}</span>
                        <span className="text-fg tabular-nums">{v.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
