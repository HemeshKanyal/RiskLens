// ==============================
// RiskLens — Utility Functions
// ==============================

/**
 * Format a number as a USD currency string.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a percentage string.
 */
export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Parse a backend timestamp. Older records were stored as naive UTC
 * ("2026-10-01T06:30:00"), which browsers would read as local time.
 */
export function parseServerDate(dateStr: string): Date {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dateStr);
  return new Date(hasZone ? dateStr : `${dateStr}Z`);
}

/**
 * Format a date string into a readable format.
 */
export function formatDate(dateStr: string): string {
  const date = parseServerDate(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string into a relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const date = parseServerDate(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// Asset classes keep a fixed categorical slot (validated order), so a class
// is always the same color regardless of which classes are present.
export const ASSET_CLASSES = ["stock", "crypto", "etf", "bond", "commodity"] as const;

export function getAssetTypeColor(type: string): string {
  const slot = ASSET_CLASSES.indexOf(type.toLowerCase() as (typeof ASSET_CLASSES)[number]);
  return slot === -1 ? "var(--series-muted)" : `var(--series-${slot + 1})`;
}

export function assetClassLabel(type: string): string {
  return type.toLowerCase() === "etf" ? "ETF" : capitalize(type);
}

/**
 * Compact currency for tight spaces: $1.2K, $65.1K, $4.2M.
 */
export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Truncate a hash string for display.
 */
export function truncateHash(hash: string, chars = 8): string {
  if (!hash) return "—";
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
