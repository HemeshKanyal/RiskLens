// ==============================
// RiskLens — TypeScript Type Definitions
// Mirrors backend Pydantic models
// ==============================

// --- Auth ---

export interface User {
  email: string;
  full_name: string;
  is_active: boolean;
  kyc_verified?: boolean;
  kyc_verified_at?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  username: string; // email — OAuth2 form uses "username"
  password: string;
}

// --- Portfolio ---

export interface Asset {
  symbol: string;
  type: "stock" | "crypto" | "etf" | "bond" | "commodity";
  value?: number | null;
  quantity?: number | null;
}

export interface PortfolioRequest {
  assets: Asset[];
  risk_profile: "conservative" | "balanced" | "aggressive";
  lookback_days: number;
}

export interface PortfolioSnapshot {
  user_email: string;
  assets: Asset[];
  risk_profile: string;
  snapshot_hash: string;
  created_at: string;
}

// --- Analysis Response ---

export type RiskLevel = "Low" | "Moderate" | "High";

export interface RiskInfo {
  risk_score: number;
  risk_level: RiskLevel;
  scale?: { min: number; max: number; thresholds: Record<string, number> };
  // Absent when market data was unavailable and only the allocation model ran
  phase1_score?: number;
  phase2_score?: number;
  phase1_weight?: number;
  phase2_weight?: number;
  explanation: string;
}

export interface Insight {
  category?: string;
  severity?: "info" | "warning" | "critical";
  message: string;
  symbol?: string;
}

export interface AssetMarketMetrics {
  volatility_pct?: number;
  vol_classification?: string;
  max_drawdown_pct?: number;
  sharpe_ratio?: number;
}

export interface Phase2Data {
  per_asset_metrics: Record<string, AssetMarketMetrics>;
  correlation_matrix: Record<string, Record<string, number>>;
  portfolio_intelligence: {
    portfolio_volatility_pct: number;
    diversification_ratio: number;
    risk_contributions: Record<string, number>;
    high_correlation_pairs?: [string, string, number][];
  };
  insights: {
    summary: string;
    portfolio_insights: Insight[];
    asset_insights?: Insight[];
  };
  market_risk_score: number;
}

/** The `ai_analysis` object produced by the backend engine. */
export interface RawAnalysis {
  summary?: {
    total_value: number;
    asset_allocations_percent: Record<string, number>;
    class_allocations_percent: Record<string, number>;
  };
  diversification?: {
    hhi: number;
    diversification_level: string;
    score: number;
    explanation?: string;
  };
  rebalancing?: {
    profile_used?: string;
    suggestions?: string[];
    explanation?: string;
  };
  phase2?: Phase2Data | null;
  risk: RiskInfo;
}

export interface AnalysisResponse {
  ai_analysis: RawAnalysis;
  llm_explanation: string;
  snapshot_hash: string;
  created_at: string;
  live_prices_used?: Record<string, number>;
}

// --- Identity attestation (zero-knowledge) ---

export interface KYCProofRequest {
  proof: string; // base64, generated in the browser
  public_inputs: string[]; // [today YYYYMMDD, identity commitment] as 0x-hex fields
}

export interface KYCResponse {
  status: "verified";
  identity_commitment_hash: string;
  verified_at: string;
}

// --- Decision Logs ---

export interface DecisionLog {
  user_email: string;
  action: "portfolio_analysis" | "kyc_verification";
  snapshot_hash?: string;
  ai_analysis?: RawAnalysis;
  llm_explanation?: string;
  identity_commitment_hash?: string;
  created_at: string;
}

// --- Pricing ---

export interface PriceResult {
  prices: Record<string, number | null>;
}

// --- Screenshot OCR ---

export interface ScreenshotResult {
  assets: Asset[];
  confidence: "high" | "medium" | "low" | "none";
  notes: string;
}

// ==============================
// PHASE 3: BEHAVIORAL INTELLIGENCE
// ==============================

export interface RecommendationFeedback {
  snapshot_hash: string;
  action: "accept" | "reject" | "modify" | "ignore";
  modification_details?: string;
  market_volatility?: number;
  reasoning?: string;
}

export interface SimulationRequest extends PortfolioRequest {
  label?: string;
}

export interface SimulationResponse {
  is_simulation: boolean;
  label: string;
  ai_analysis: AnalysisResponse["ai_analysis"];
  llm_explanation: string;
  simulated_at: string;
  live_prices_used?: Record<string, number>;
}

export interface BacktestRequest {
  assets: Asset[];
  event_id: string;
}

export interface BacktestResponse {
  is_backtest: boolean;
  event_id: string;
  analysis: Record<string, unknown>;
  llm_explanation: string;
  generated_at: string;
}

export interface AuditEntry {
  timestamp: string;
  snapshot_hash: string;
  ai_risk_score?: number;
  ai_risk_level?: string;
  had_rebalancing: boolean;
  user_action: string;
  user_reasoning?: string;
  market_volatility?: number;
  response_time?: number | null;
}

export interface AuditResponse {
  total_decisions: number;
  response_rate: number;
  accept_rate: number;
  action_counts: Record<string, number>;
  drifts: string[];
  volatility_patterns: {
    high_vol_total: number;
    high_vol_rejects: number;
    panic_sell_probability?: number;
  };
  audit_trail: AuditEntry[];
}
