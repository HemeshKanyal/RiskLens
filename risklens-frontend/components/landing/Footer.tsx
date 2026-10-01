import Link from "next/link";
import { DISCLAIMER } from "@/components/ui/Disclaimer";

export default function Footer() {
  const links = [
    { label: "GitHub", href: "https://github.com/HemeshKanyal/RiskLens" },
  ];

  return (
    <footer className="border-t border-white/[0.07] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left */}
        <div className="text-center md:text-left">
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            RiskLens
          </span>
          <p className="text-xs text-gray-500 mt-1">
            AI-powered portfolio intelligence
          </p>
        </div>

        {/* Right */}
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="max-w-6xl mx-auto mt-6 text-[11px] leading-relaxed text-gray-500 text-center md:text-left">
        {DISCLAIMER}
      </p>
    </footer>
  );
}
