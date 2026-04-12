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
 * Format a date string into a readable format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
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
  const date = new Date(dateStr);
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

/**
 * Get a color for risk level.
 */
export function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case "low":
      return "#10B981"; // emerald
    case "moderate":
      return "#F59E0B"; // amber
    case "high":
      return "#EF4444"; // red
    default:
      return "#6B7280"; // gray
  }
}

/**
 * Get a color for an asset type.
 */
export function getAssetTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "stock":
      return "#3B82F6"; // blue
    case "crypto":
      return "#A855F7"; // purple
    case "etf":
      return "#06B6D4"; // cyan
    case "bond":
      return "#10B981"; // emerald
    case "commodity":
      return "#F59E0B"; // amber
    default:
      return "#6B7280"; // gray
  }
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
 * Get Etherscan URL for a transaction hash (Sepolia testnet).
 */
export function getEtherscanUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
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
