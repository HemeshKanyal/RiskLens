import Logo from "@/components/ui/Logo";
import { DISCLAIMER } from "@/components/ui/Disclaimer";

export default function Footer() {
    return (
        <footer className="nb-footer">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Logo />
                    <a
                        href="https://github.com/HemeshKanyal/RiskLens"
                        className="text-sm underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Source on GitHub
                    </a>
                </div>
                <p className="text-xs leading-relaxed max-w-3xl opacity-75">{DISCLAIMER}</p>
            </div>
        </footer>
    );
}
