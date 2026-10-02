// Every dashboard page is a chapter of the notebook: numeral, Italian caption, title.
export const APP_CHAPTERS = {
    overview: { numeral: "I", caption: "Il quaderno", href: "/dashboard", label: "Overview" },
    analysis: { numeral: "II", caption: "Una nuova misura", href: "/dashboard/portfolio", label: "New analysis" },
    trends: { numeral: "III", caption: "Tendenze e prove", href: "/dashboard/analytics", label: "Trends & stress tests" },
    history: { numeral: "IV", caption: "L'archivio", href: "/dashboard/history", label: "History" },
    patterns: { numeral: "V", caption: "Le abitudini", href: "/dashboard/audit", label: "Decision patterns" },
    identity: { numeral: "VI", caption: "Il sigillo", href: "/dashboard/kyc", label: "Identity check" },
    settings: { numeral: "VII", caption: "Le impostazioni", href: "/dashboard/settings", label: "Settings" },
} as const;
