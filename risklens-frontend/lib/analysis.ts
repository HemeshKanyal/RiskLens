// ==============================
// RiskLens — Analysis view model
// Turns the backend's raw analysis object into the plain-language
// figures the UI shows, so pages don't each re-derive them.
// ==============================

import type { Insight, RawAnalysis, RiskLevel } from "./types";
import type { Tone } from "@/components/ui/Badge";

export const RISK_SCALE_MAX = 5;
// Matches the backend's _score_to_level thresholds
export const RISK_THRESHOLDS = { moderate: 1, high: 3 } as const;

export function riskTone(level?: string): Tone {
  switch (level?.toLowerCase()) {
    case "low":
      return "positive";
    case "moderate":
      return "warning";
    case "high":
      return "negative";
    default:
      return "neutral";
  }
}

export interface HoldingRow {
  symbol: string;
  weightPct: number;
  riskSharePct?: number;
  volatilityPct?: number;
  maxDrawdownPct?: number;
  sharpe?: number;
}

export interface Finding {
  tone: Tone;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface AnalysisView {
  score: number;
  level: RiskLevel;
  allocationScore?: number;
  allocationWeight?: number;
  marketScore?: number;
  marketWeight?: number;
  hasMarketData: boolean;
  totalValue?: number;
  volatilityPct?: number;
  diversificationRatio?: number;
  diversificationScore?: number;
  diversificationLevel?: string;
  classWeights: Record<string, number>;
  holdings: HoldingRow[];
  correlatedPairs: { a: string; b: string; r: number }[];
  findings: Finding[];
  summary?: string;
  suggestions: string[];
}

// The engine prefixes messages with an emoji; the UI conveys severity with
// a labelled badge instead, so drop it.
export function cleanMessage(message: string): string {
  return message.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "").trim();
}

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 } as const;

function toFinding(i: Insight): Finding {
  const severity = i.severity ?? "info";
  return {
    severity,
    tone: severity === "critical" ? "negative" : severity === "warning" ? "warning" : "neutral",
    message: cleanMessage(i.message),
  };
}

export function buildAnalysisView(raw: RawAnalysis): AnalysisView {
  const risk = raw.risk;
  const p2 = raw.phase2 ?? undefined;
  const intel = p2?.portfolio_intelligence;
  const assetWeights = raw.summary?.asset_allocations_percent ?? {};

  const holdings: HoldingRow[] = Object.entries(assetWeights)
    .map(([symbol, weightPct]) => {
      const m = p2?.per_asset_metrics?.[symbol];
      return {
        symbol,
        weightPct,
        riskSharePct: intel?.risk_contributions?.[symbol],
        volatilityPct: m?.volatility_pct,
        maxDrawdownPct: m?.max_drawdown_pct,
        sharpe: m?.sharpe_ratio,
      };
    })
    .sort((a, b) => (b.riskSharePct ?? b.weightPct) - (a.riskSharePct ?? a.weightPct));

  const findings = [...(p2?.insights?.portfolio_insights ?? []), ...(p2?.insights?.asset_insights ?? [])]
    .filter((i) => i && typeof i.message === "string")
    .map(toFinding)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return {
    score: risk.risk_score,
    level: risk.risk_level,
    allocationScore: risk.phase1_score ?? (p2 ? undefined : risk.risk_score),
    allocationWeight: risk.phase1_weight,
    marketScore: risk.phase2_score,
    marketWeight: risk.phase2_weight,
    hasMarketData: !!p2,
    totalValue: raw.summary?.total_value,
    volatilityPct: intel?.portfolio_volatility_pct,
    diversificationRatio: intel?.diversification_ratio,
    diversificationScore: raw.diversification?.score,
    diversificationLevel: raw.diversification?.diversification_level,
    classWeights: raw.summary?.class_allocations_percent ?? {},
    holdings,
    correlatedPairs: (intel?.high_correlation_pairs ?? []).map(([a, b, r]) => ({ a, b, r })),
    findings,
    summary: p2?.insights?.summary,
    suggestions: raw.rebalancing?.suggestions ?? [],
  };
}
