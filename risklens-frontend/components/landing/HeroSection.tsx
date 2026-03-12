export default function HeroSection() {
    return (
        <section className="hero-bg pt-32 pb-20 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

                {/* Text */}
                <div>
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                        Track Risk.
                        <br />
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Understand Your Portfolio.
                        </span>
                    </h1>

                    <p className="mt-6 text-gray-400 text-lg max-w-lg">
                        AI-powered portfolio intelligence platform that analyzes risk,
                        diversification, and portfolio health.
                    </p>

                    <div className="mt-8 flex gap-4">
                        <button className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-lg font-medium hover:opacity-90 transition">
                            Get Started
                        </button>

                        <button className="border border-gray-700 px-6 py-3 rounded-lg hover:border-gray-500 transition">
                            View Demo
                        </button>
                    </div>
                </div>

                {/* Dashboard Visual */}
                <div className="relative flex justify-center">
                    <div className="relative">

                        {/* Portfolio Card */}
                        <div className="absolute -top-10 left-10 w-48 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
                            <p className="text-sm text-gray-400">Portfolio Value</p>
                            <p className="text-xl font-semibold">$124,560</p>
                            <p className="text-green-400 text-sm">+3.2%</p>
                        </div>

                        {/* Allocation Card */}
                        <div className="w-[360px] h-[220px] p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center">
                            Allocation Chart
                        </div>

                        {/* Risk Score Card */}
                        <div className="absolute -bottom-8 right-10 w-40 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
                            <p className="text-sm text-gray-400">Risk Level</p>
                            <p className="text-lg font-semibold">Medium</p>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}