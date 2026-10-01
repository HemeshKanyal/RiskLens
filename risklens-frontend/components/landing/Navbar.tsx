import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { buttonStyles } from "@/components/ui/Button";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur border-b border-line">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                <Logo />
                <nav className="flex items-center gap-1 sm:gap-2" aria-label="Site">
                    <a href="#how-it-works" className="hidden sm:inline-flex h-9 items-center px-3 text-sm text-fg-2 hover:text-fg">
                        How it works
                    </a>
                    <a href="#methodology" className="hidden sm:inline-flex h-9 items-center px-3 text-sm text-fg-2 hover:text-fg">
                        Methodology
                    </a>
                    <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                        Sign in
                    </Link>
                    <Link href="/signup" className={buttonStyles({ size: "sm" })}>
                        Get started
                    </Link>
                </nav>
            </div>
        </header>
    );
}
