export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-transparent">
            <div className="max-w-7xl mx-auto px-8 h-[80px] flex items-center justify-between">

                {/* Logo */}
                <div className="text-xl font-semibold tracking-tight">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        RiskLens
                    </span>
                </div>

                {/* Navigation */}
                <div className="hidden md:flex items-center gap-10 text-sm text-gray-300">
                    <a href="#" className="hover:text-white transition">
                        Platform
                    </a>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-5">

                    <button className="text-sm text-gray-300 hover:text-white transition">
                        Login
                    </button>

                    <button className="px-5 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition">
                        Get Started
                    </button>

                </div>

            </div>
        </nav>
    );
}   