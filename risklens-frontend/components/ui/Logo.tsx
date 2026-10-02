import Link from "next/link";

/** A small astrolabe (the "lens") and the wordmark: Risk in sans, Lens in italic serif. */
export function LogoMark({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="11" cy="11" r="8.5" strokeWidth="1.6" />
            <circle cx="11" cy="11" r="4.5" strokeWidth="1" strokeDasharray="1.2 1.6" />
            <path d="M11 2.5v2M11 17.5v2M2.5 11h2M17.5 11h2" strokeWidth="1.2" />
            <path d="M17.2 17.2 22 22" strokeWidth="2" strokeLinecap="round" />
            <circle cx="11" cy="11" r="1.3" fill="var(--accent)" stroke="none" />
        </svg>
    );
}

export default function Logo({ href = "/" }: { href?: string }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2 text-fg" aria-label="RiskLens home">
            <LogoMark />
            <span className="text-[17px] font-bold tracking-tight leading-none">
                Risk<span className="font-serif italic font-normal">Lens</span>
            </span>
        </Link>
    );
}
