// ==============================
// RiskLens — API Service Layer
// Central HTTP client for all backend communication
// ==============================

import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  Token,
  RegisterPayload,
  User,
  PortfolioRequest,
  AnalysisResponse,
  KYCRequest,
  KYCResponse,
  PortfolioSnapshot,
  DecisionLog,
  PriceResult,
  ScreenshotResult,
  AssetMetrics,
  QuickRiskResult,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---- Axios instance ----

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 200_000, // 3+ minutes — LLM + ZK proof + blockchain can be slow
  headers: { "Content-Type": "application/json" },
});

// ---- Token helpers ----

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("risklens_token");
}

export function setToken(token: string): void {
  localStorage.setItem("risklens_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("risklens_token");
}

// ---- Request interceptor: attach JWT ----

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: handle 401 ----

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---- Error extractor ----

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join(", ");
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

// ==============================
// AUTH ENDPOINTS
// ==============================

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function login(email: string, password: string): Promise<Token> {
  // Backend expects OAuth2 form data (x-www-form-urlencoded)
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const { data } = await api.post<Token>("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  setToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

// ==============================
// PORTFOLIO ANALYSIS
// ==============================

export async function analyzePortfolio(
  request: PortfolioRequest,
  walletMode = false
): Promise<AnalysisResponse> {
  const { data } = await api.post<AnalysisResponse>(
    `/analyze${walletMode ? "?wallet_mode=true" : ""}`,
    request
  );
  return data;
}

// ==============================
// KYC VERIFICATION
// ==============================

export async function verifyKYC(
  request: KYCRequest,
  walletMode = false
): Promise<KYCResponse> {
  const { data } = await api.post<KYCResponse>(
    `/verify-kyc${walletMode ? "?wallet_mode=true" : ""}`,
    request
  );
  return data;
}

// ==============================
// CONFIRM USER TRANSACTION
// ==============================

export async function confirmTx(payload: {
  tx_hash: string;
  action: string;
  snapshot_hash?: string;
}): Promise<{ status: string; tx_hash: string }> {
  const { data } = await api.post("/confirm-tx", payload);
  return data;
}

// ==============================
// HISTORY
// ==============================

export async function getPortfolioHistory(): Promise<{
  portfolios: PortfolioSnapshot[];
  count: number;
}> {
  const { data } = await api.get("/portfolio/history");
  return data;
}

export async function getDecisionLogs(): Promise<{
  decisions: DecisionLog[];
  count: number;
}> {
  const { data } = await api.get("/decisions");
  return data;
}

// ==============================
// PRICING
// ==============================

export async function fetchPrices(
  symbols: string[],
  types: string[]
): Promise<PriceResult> {
  const { data } = await api.get<PriceResult>("/prices", {
    params: {
      symbols: symbols.join(","),
      types: types.join(","),
    },
  });
  return data;
}

// ==============================
// SCREENSHOT OCR
// ==============================

export async function parseScreenshot(files: File[]): Promise<ScreenshotResult> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await api.post<ScreenshotResult>(
    "/portfolio/parse-screenshot",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

// ==============================
// MARKET RISK (Phase 2)
// ==============================

export async function getAssetMetrics(
  symbol: string,
  lookbackDays = 90
): Promise<{ status: string; data: AssetMetrics }> {
  const { data } = await api.get(`/api/market-risk/asset/${symbol}`, {
    params: { lookback_days: lookbackDays },
  });
  return data;
}

export async function getQuickRisk(
  request: PortfolioRequest
): Promise<{ status: string; data: QuickRiskResult }> {
  const { data } = await api.post("/api/market-risk/quick-risk", request);
  return data;
}

// ==============================
// PHASE 3: BEHAVIORAL INTELLIGENCE
// ==============================

import type {
  RecommendationFeedback,
  SimulationRequest,
  SimulationResponse,
  BacktestRequest,
  BacktestResponse,
  AuditResponse,
} from "./types";

export async function submitFeedback(
  payload: RecommendationFeedback
): Promise<{ status: string }> {
  const { data } = await api.post("/portfolio/feedback", payload);
  return data;
}

export async function simulatePortfolio(
  request: SimulationRequest
): Promise<SimulationResponse> {
  const { data } = await api.post<SimulationResponse>("/simulate", request);
  return data;
}

export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  const { data } = await api.post<BacktestResponse>("/backtest", request);
  return data;
}

export async function getDecisionAudit(): Promise<AuditResponse> {
  const { data } = await api.get<AuditResponse>("/portfolio/audit");
  return data;
}

export default api;
