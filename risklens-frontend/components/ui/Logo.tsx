import Link from "next/link";

export default function Logo({ href = "/" }: { href?: string }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2 text-fg" aria-label="RiskLens home">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <rect width="24" height="24" rx="6" className="fill-accent-solid" />
                <circle cx="11" cy="11" r="5" fill="none" stroke="white" strokeWidth="2" />
                <path d="M14.5 14.5 18 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight">RiskLens</span>
        </Link>
    );
}
