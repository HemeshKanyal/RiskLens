import Link from "next/link";
import ParallaxScene, { Depth } from "./ParallaxScene";
import { InkDefs, ConstructionLayer, LensLayer, StudiesBack, StudiesStars, StudiesNotes, StudiesPhone } from "./drawings";


export const CHAPTERS = [
    { n: "I", id: "allocation", title: "Allocation" },
    { n: "II", id: "volatility", title: "Volatility" },
    { n: "III", id: "correlation", title: "Correlation" },
    { n: "IV", id: "stress", title: "Stress tests" },
    { n: "V", id: "privacy", title: "Privacy" },
];

export default function Hero() {
    return (
        <section className="nb" aria-labelledby="hero-title">
            <InkDefs />
            <ParallaxScene className="nb-stage">
                <div className="nb-paper" aria-hidden="true" />
                <Depth depth={0}><ConstructionLayer /></Depth>
                <Depth depth={0.25} className="nb-reveal"><LensLayer /></Depth>
                <Depth depth={0.55} className="nb-reveal nb-reveal-2"><StudiesBack /></Depth>
                <Depth depth={0.7} className="nb-reveal nb-reveal-2"><StudiesStars /></Depth>
                <Depth depth={0.9} className="nb-reveal nb-reveal-3"><StudiesNotes /></Depth>
                <Depth depth={1.6} className="nb-reveal nb-reveal-4 nb-float"><StudiesPhone /></Depth>

                {/* Same cover box as the SVG layers, so the frame lines up with the drawing */}
                <div className="nb-cover">
                    <div className="nb-frame">
                        <h1 id="hero-title" className="nb-title">
                            Risk<em>Lens</em>
                        </h1>
                        <p className="nb-tagline">
                            A notebook for seeing the risk inside your portfolio.
                        </p>
                        <nav aria-label="Chapters" className="nb-index">
                            <ol>
                                {CHAPTERS.map((c) => (
                                    <li key={c.id}>
                                        <a href={`#${c.id}`}>
                                            <span>{c.title}</span>
                                            <span className="nb-index-n">{c.n}</span>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                        <Link href="/signup" className="nb-cta">
                            Open your notebook
                        </Link>
                    </div>
                </div>
            </ParallaxScene>
        </section>
    );
}
