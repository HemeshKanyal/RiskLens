import Link from "next/link";
import React from "react";
import ParallaxScene, { Depth } from "./ParallaxScene";
import { serif, fell } from "./Hero";
import { Plate, Stones, BellCurve, Constellation, Drawdown, SealedLetter } from "./drawings";

interface Chapter {
    n: string;
    id: string;
    title: string;
    caption: string; // in the notebook's Italian
    lead: string;
    body: string;
    plate: { viewBox: string; study: React.ReactNode };
}

const CHAPTERS: Chapter[] = [
    {
        n: "I",
        id: "allocation",
        title: "Allocation",
        caption: "Dove riposa il peso",
        lead: "Where your money actually sits.",
        body: "RiskLens groups your holdings by asset class and scores how much of the portfolio rests on the riskier ones, measured against the profile you choose: conservative, balanced or aggressive.",
        plate: { viewBox: "-40 -170 360 270", study: <Stones /> },
    },
    {
        n: "II",
        id: "volatility",
        title: "Volatility",
        caption: "Quanto oscilla",
        lead: "How far it swings.",
        body: "From up to 180 days of daily prices: annualised volatility, the worst peak-to-trough fall and risk-adjusted return for every holding, and for the portfolio as a whole.",
        plate: { viewBox: "0 0 500 300", study: <BellCurve /> },
    },
    {
        n: "III",
        id: "correlation",
        title: "Correlation",
        caption: "Ciò che si muove insieme",
        lead: "What moves together.",
        body: "Two holdings that rise and fall together don't spread your risk. RiskLens maps the correlations and shows each holding's share of total risk next to its share of value.",
        plate: { viewBox: "0 -10 480 320", study: <Constellation /> },
    },
    {
        n: "IV",
        id: "stress",
        title: "Stress tests",
        caption: "La prova del fuoco",
        lead: "How it would have held up.",
        body: "Replay your current holdings through the 2008 financial crisis, the 2020 crash or the 2022 crypto winter, and see the deepest fall you would have lived through.",
        plate: { viewBox: "0 0 520 320", study: <Drawdown /> },
    },
    {
        n: "V",
        id: "privacy",
        title: "Privacy",
        caption: "Ciò che resta sigillato",
        lead: "What stays yours.",
        body: "The identity check is a zero-knowledge proof made in your browser. RiskLens confirms you're 18 or older without ever receiving your name, birth date or document number.",
        plate: { viewBox: "0 0 420 310", study: <SealedLetter /> },
    },
];

function ChapterPage({ chapter, flip }: { chapter: Chapter; flip: boolean }) {
    return (
        <section id={chapter.id} className="nb-chapter" aria-labelledby={`${chapter.id}-title`}>
            <div className={`nb-chapter-grid ${flip ? "nb-flip" : ""}`}>
                <div className="nb-chapter-text">
                    <p className="nb-chapter-n">
                        <span>{chapter.n}</span> {chapter.caption}
                    </p>
                    <h2 id={`${chapter.id}-title`} className="nb-chapter-title">{chapter.title}</h2>
                    <p className="nb-chapter-lead">{chapter.lead}</p>
                    <p className="nb-chapter-body">{chapter.body}</p>
                </div>
                <ParallaxScene className="nb-chapter-plate">
                    <Depth depth={0.25}>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="nb-plate-frame">
                            <rect x="2" y="2" width="96" height="96" fill="none" stroke="var(--nb-line)" strokeWidth="0.25" />
                            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--nb-line)" strokeWidth="0.2" />
                            <path d="M2 2L98 98M98 2L2 98" stroke="var(--nb-line)" strokeWidth="0.15" />
                        </svg>
                    </Depth>
                    <Depth depth={0.8}>
                        <Plate viewBox={chapter.plate.viewBox} className="nb-plate-study">{chapter.plate.study}</Plate>
                    </Depth>
                </ParallaxScene>
            </div>
        </section>
    );
}

export default function Chapters() {
    return (
        <div className={`nb-book ${serif.variable} ${fell.variable}`}>
            {CHAPTERS.map((c, i) => (
                <ChapterPage key={c.id} chapter={c} flip={i % 2 === 1} />
            ))}

            <section className="nb-closing" aria-labelledby="closing-title">
                <p className="nb-chapter-n"><span>Fine</span> e principio</p>
                <h2 id="closing-title" className="nb-chapter-title">
                    Open your <em>notebook</em>.
                </h2>
                <p className="nb-chapter-body max-w-xl mx-auto">
                    The 0–5 risk score is 40% asset-class mix and 60% measured volatility. A language model
                    writes the explanation from those figures; it never produces the numbers. For education, not
                    investment advice.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link href="/signup" className="nb-cta nb-cta-lg">Create an account</Link>
                    <Link href="/login" className="nb-cta nb-cta-lg nb-cta-ghost">Sign in</Link>
                </div>
            </section>
        </div>
    );
}
