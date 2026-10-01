import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ProductPreview from "@/components/landing/ProductPreview";
import { buttonStyles } from "@/components/ui/Button";

const MEASURES = [
    {
        title: "Where the risk comes from",
        body: "Each holding's share of total volatility next to its share of value, so you can see which positions punch above their weight.",
    },
    {
        title: "Whether you're really diversified",
        body: "Correlations between holdings and a diversification ratio. Two coins that move together don't spread your risk.",
    },
    {
        title: "How bad it has been",
        body: "Annualised volatility, maximum drawdown and risk-adjusted return per asset, plus replays of past crises like 2008 and 2020.",
    },
];

const STEPS = [
    { n: "1", title: "Add your holdings", body: "Type them in or upload a screenshot of your brokerage holdings. Stocks, ETFs, crypto, bonds and commodities." },
    { n: "2", title: "Get the breakdown", body: "A 0–5 risk score, what drives it, findings ranked by importance and suggested changes for your risk profile." },
    { n: "3", title: "Track it over time", body: "Each analysis is saved so you can compare scores and run stress tests on your latest holdings." },
];

export default function Home() {
    return (
        <>
            <Navbar />
            <main>
                <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-fg leading-[1.1]">
                            See where your portfolio&apos;s risk actually comes from.
                        </h1>
                        <p className="mt-5 text-lg text-fg-2 leading-relaxed max-w-xl">
                            RiskLens measures volatility, concentration and correlation across your holdings, then explains
                            the result in plain language.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/signup" className={buttonStyles({ size: "lg" })}>
                                Analyze my portfolio
                            </Link>
                            <a href="#how-it-works" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                                How it works
                            </a>
                        </div>
                        <p className="mt-4 text-xs text-muted">For education, not investment advice.</p>
                    </div>
                    <ProductPreview />
                </section>

                <section className="border-t border-line bg-surface">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg max-w-2xl">
                            Returns tell you what happened. Risk tells you what could.
                        </h2>
                        <div className="mt-10 grid gap-8 md:grid-cols-3">
                            {MEASURES.map((m) => (
                                <div key={m.title}>
                                    <h3 className="text-base font-semibold text-fg">{m.title}</h3>
                                    <p className="mt-2 text-sm text-fg-2 leading-relaxed">{m.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="how-it-works" className="border-t border-line scroll-mt-14">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">How it works</h2>
                        <ol className="mt-10 grid gap-8 md:grid-cols-3">
                            {STEPS.map((s) => (
                                <li key={s.n}>
                                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-accent-soft text-accent-text text-sm font-semibold">
                                        {s.n}
                                    </span>
                                    <h3 className="mt-3 text-base font-semibold text-fg">{s.title}</h3>
                                    <p className="mt-2 text-sm text-fg-2 leading-relaxed">{s.body}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section id="methodology" className="border-t border-line bg-surface scroll-mt-14">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid gap-10 lg:grid-cols-2">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">Methodology, plainly</h2>
                            <p className="mt-4 text-sm text-fg-2 leading-relaxed">
                                The risk score blends two parts: how much of your portfolio sits in higher-risk asset classes
                                (40%), and how volatile the portfolio has actually been over the price history you choose
                                (60%). Market figures come from daily closing prices. A language model then writes the
                                explanation from those figures; it doesn&apos;t produce the numbers.
                            </p>
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">What the on-chain record is</h2>
                            <p className="mt-4 text-sm text-fg-2 leading-relaxed">
                                Each saved analysis is hashed and the hash is recorded on the Ethereum Sepolia testnet. That
                                lets you show a snapshot existed at a point in time and hasn&apos;t been edited since. It
                                doesn&apos;t prove the analysis is correct, and it isn&apos;t on mainnet.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-t border-line">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-semibold tracking-tight text-fg">Find out what you&apos;re really holding.</h2>
                        <Link href="/signup" className={buttonStyles({ size: "lg" })}>
                            Create an account
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
