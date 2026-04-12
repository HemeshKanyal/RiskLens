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
  kyc_tx?: string;
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
  blockchain_tx: string | null;
  blockchain_status: "confirmed" | "failed";
  created_at: string;
}

// --- Analysis Response ---

export interface RiskInfo {
  risk_score: number;
  risk_level: "Low" | "Moderate" | "High";
  scale: { min: number; max: number; thresholds: Record<string, number> };
  phase1_score: number;
  phase2_score: number;
  phase1_weight: number;
  phase2_weight: number;
  explanation: string;
}

export interface Phase2Data {
  per_asset_metrics: Record<string, Record<string, number>>;
  correlation_matrix: Record<string, Record<string, number>>;
  portfolio_intelligence: {
    portfolio_volatility_pct: number;
    diversification_ratio: number;
    risk_contributions: Record<string, number>;
    [key: string]: unknown;
  };
  insights: {
    summary: string;
    portfolio_insights: string[];
    [key: string]: unknown;
  };
  market_risk_score: number;
}

export interface AnalysisResponse {
  ai_analysis: {
    summary: Record<string, unknown>;
    diversification: Record<string, unknown>;
    rebalancing: Record<string, unknown>;
    phase1_risk?: Record<string, unknown>;
    phase2?: Phase2Data;
    risk: RiskInfo;
    [key: string]: unknown;
  };
  llm_explanation: string;
  snapshot_hash: string;
  claim_hash: string;
  zk_proof: string;
  public_inputs: string;
  blockchain_tx: string | null;
  blockchain_status: "confirmed" | "failed";
  live_prices_used?: Record<string, number>;
  blockchain_warning?: string;
}

// --- KYC ---

export interface KYCRequest {
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  country_code: number;
  document_id: string;
  age: number;
}

export interface KYCResponse {
  status: string;
  identity_commitment_hash: string;
  zk_proof: string;
  public_inputs: string;
  blockchain_tx: string | null;
  blockchain_status: "confirmed" | "failed";
  blockchain_warning?: string;
}

// --- Decision Logs ---

export interface DecisionLog {
  user_email: string;
  action: "portfolio_analysis" | "kyc_verification";
  snapshot_hash?: string;
  claim_hash?: string;
  ai_analysis?: Record<string, unknown>;
  llm_explanation?: string;
  identity_commitment_hash?: string;
  blockchain_tx: string | null;
  blockchain_status: "confirmed" | "failed";
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

// --- Market Risk ---

export interface AssetMetrics {
  symbol: string;
  metrics: Record<string, number>;
  price_history: { date: string; close: number }[];
  data_points: number;
}

export interface QuickRiskResult {
  portfolio_volatility: number;
  diversification_ratio: number;
  risk_contributions: Record<string, number>;
  summary: string;
  top_insights: string[];
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
