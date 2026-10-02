// ==============================
// RiskLens — Notebook drawings
// Da Vinci–style studies of risk, drawn as SVG. Each study is a <g> in its
// own local coordinates; the hero places them on one 1600×900 sheet (sliced
// to cover the viewport) and the chapters show them on their own plates.
// ==============================

import React from "react";

export const W = 1600;
export const H = 900;
export const CX = 800;
export const CY = 450;

// Deterministic pseudo-random, so server and client render the same marks
function seeded(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};

const f = (n: number) => n.toFixed(1);

/** A full-sheet layer for the hero (1600×900, covers the viewport). */
export function Sheet({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            {children}
        </svg>
    );
}

/** A single study on its own plate (chapters). */
export function Plate({ viewBox, children, className }: { viewBox: string; children: React.ReactNode; className?: string }) {
    return (
        <svg className={className} viewBox={viewBox} aria-hidden="true" focusable="false">
            {children}
        </svg>
    );
}

/** Shared SVG filters and fills: a slight wobble so lines look hand-inked. */
export function InkDefs() {
    return (
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
            <defs>
                <filter id="nb-ink" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
                    <feDisplacementMap in="SourceGraphic" scale="2.2" />
                </filter>
                <pattern id="nb-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
                    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--nb-sepia)" strokeWidth="1" />
                </pattern>
                <pattern id="nb-crosshatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
                    <path d="M0 0V6M0 0H6" stroke="var(--nb-chalk)" strokeWidth="1" />
                </pattern>
            </defs>
        </svg>
    );
}

/* ---------- Construction geometry (drawn during the intro) ---------- */

export function ConstructionLayer() {
    const fx = 650, fy = 255, fw = 300, fh = 390;
    const golden: string[] = [];
    let x = fx - 241, y = fy, s = 241;
    for (let i = 0; i < 6; i++) {
        golden.push(`M${f(x)} ${f(y)}h${f(s)}v${f(s)}h${-s}z`);
        const n = s / 1.618;
        if (i % 4 === 0) x += s - n;
        else if (i % 4 === 1) { y += s - n; x += s - n; }
        else if (i % 4 === 2) y += s - n;
        s = n;
    }
    const lines = [
        `M${fx} 0V${H}`, `M${fx + fw} 0V${H}`, `M0 ${fy}H${W}`, `M0 ${fy + fh}H${W}`, `M${CX} 0V${H}`,
        `M0 ${CY - 450}L${W} ${CY + 450}`, `M0 ${CY + 450}L${W} ${CY - 450}`,
        `M${CX - 640} 0L${CX + 640} ${H}`, `M${CX + 640} 0L${CX - 640} ${H}`,
    ];
    return (
        <Sheet className="nb-construction">
            <g fill="none" stroke="var(--nb-line)" strokeWidth="1">
                {lines.map((d, i) => (
                    <path key={i} d={d} pathLength={1} style={{ animationDelay: `${i * 60}ms` }} />
                ))}
                <circle cx={CX} cy={CY - 330} r="330" pathLength={1} style={{ animationDelay: "200ms" }} />
                <circle cx={CX} cy={CY + 330} r="330" pathLength={1} style={{ animationDelay: "260ms" }} />
                <circle cx={CX} cy={CY} r="455" pathLength={1} style={{ animationDelay: "320ms" }} />
                {golden.map((d, i) => (
                    <path key={`g${i}`} d={d} pathLength={1} style={{ animationDelay: `${400 + i * 80}ms` }} />
                ))}
                {golden.map((d, i) => (
                    <path key={`gm${i}`} d={d} pathLength={1} transform={`rotate(180 ${CX} ${CY})`} style={{ animationDelay: `${450 + i * 80}ms` }} />
                ))}
            </g>
        </Sheet>
    );
}

/* ---------- The Risk Lens: an astrolabe around the frame ---------- */

const NUMERALS = ["0", "I", "II", "III", "IV", "V"];

export function LensLayer() {
    const ticks: string[] = [];
    for (let d = 0; d < 360; d += 2.5) {
        const long = d % 30 === 0, mid = d % 10 === 0;
        const [x1, y1] = polar(CX, CY, 520, d);
        const [x2, y2] = polar(CX, CY, long ? 490 : mid ? 503 : 510, d);
        ticks.push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`);
    }
    const labels = Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30;
        const [x, y] = polar(CX, CY, 545, deg);
        return { x, y, deg, text: NUMERALS[i % 6] };
    });
    return (
        <Sheet className="nb-lens">
            <g fill="none" stroke="var(--nb-sepia)" filter="url(#nb-ink)">
                <g className="nb-spin-slow">
                    <circle cx={CX} cy={CY} r="520" strokeWidth="1.4" />
                    <circle cx={CX} cy={CY} r="490" strokeWidth="0.8" />
                    <path d={ticks.join("")} strokeWidth="0.9" />
                    {labels.map((l) => (
                        <text
                            key={l.deg}
                            x={l.x}
                            y={l.y}
                            transform={`rotate(${l.deg} ${f(l.x)} ${f(l.y)})`}
                            className="nb-numeral"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            stroke="none"
                        >
                            {l.text}
                        </text>
                    ))}
                </g>
                <g className="nb-spin-rev">
                    <circle cx={CX} cy={CY} r="440" strokeWidth="0.8" strokeDasharray="2 6" />
                    <circle cx={CX} cy={CY} r="300" strokeWidth="1.2" />
                    {[0, 72, 144, 216, 288].map((d) => {
                        const [x, y] = polar(CX, CY, 300, d);
                        return <circle key={d} cx={x} cy={y} r="5" fill="var(--nb-paper)" strokeWidth="1.2" />;
                    })}
                </g>
            </g>
        </Sheet>
    );
}

/* ---------- Study: the bell curve (local 0–500 × 0–300) ---------- */

export function BellCurve() {
    const ox = 40, oy = 250, w = 440, h = 190;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
        const z = -3.2 + (6.4 * i) / 120;
        pts.push([ox + ((z + 3.2) / 6.4) * w, oy - Math.exp(-(z * z) / 2) * h]);
    }
    const curve = "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");
    const zx = (z: number) => ox + ((z + 3.2) / 6.4) * w;
    const tail = pts.filter(([x]) => x <= zx(-1.65));
    const tailPath = `M${f(tail[0][0])} ${oy}L` + tail.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + `L${f(tail[tail.length - 1][0])} ${oy}Z`;
    return (
        <g>
            <g filter="url(#nb-ink)">
                <path d={`${curve}L${ox + w} ${oy}L${ox} ${oy}Z`} fill="url(#nb-hatch)" opacity="0.35" />
                <path d={tailPath} fill="url(#nb-crosshatch)" opacity="0.8" />
                <path d={curve} fill="none" stroke="var(--nb-ink)" strokeWidth="1.8" />
                <path d={`M${ox - 20} ${oy}H${ox + w + 20}`} stroke="var(--nb-ink)" strokeWidth="1.2" />
                {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
                    <g key={z}>
                        <path d={`M${f(zx(z))} ${oy}v8`} stroke="var(--nb-ink)" />
                        <text x={zx(z)} y={oy + 26} textAnchor="middle" className="nb-note-sm">
                            {z === 0 ? "μ" : `${z > 0 ? "+" : "−"}${Math.abs(z)}σ`}
                        </text>
                    </g>
                ))}
                <path d={`M${f(zx(0))} ${oy - h - 18}V${oy}`} stroke="var(--nb-sepia)" strokeDasharray="3 5" fill="none" />
                <path d={`M${f(zx(-1.65))} ${oy - 90}V${oy}`} stroke="var(--nb-chalk)" strokeWidth="1.4" />
            </g>
            <text x={ox} y={oy - h - 40} className="nb-note">Studio della volatilità</text>
            <text x={zx(-2.9)} y={oy - 120} className="nb-note nb-chalk-text">la coda —</text>
            <text x={zx(-2.9)} y={oy - 98} className="nb-note-sm nb-chalk-text">where losses live (5%)</text>
            <path d={`M${f(zx(-2.3))} ${oy - 92}q10 30 30 62`} fill="none" stroke="var(--nb-chalk)" strokeWidth="1" />
        </g>
    );
}

/* ---------- Study: correlation as a star chart (local 0–480 × 0–300) ---------- */

const STARS = [
    { id: "AAPL", x: 110, y: 100 },
    { id: "MSFT", x: 225, y: 55 },
    { id: "SPY", x: 175, y: 190 },
    { id: "BTC", x: 340, y: 140 },
    { id: "ETH", x: 420, y: 225 },
    { id: "GLD", x: 40, y: 255 },
];
const LINKS: [string, string, number][] = [
    ["AAPL", "MSFT", 0.62], ["AAPL", "SPY", 0.71], ["MSFT", "SPY", 0.68],
    ["BTC", "ETH", 0.87], ["SPY", "BTC", 0.31], ["GLD", "SPY", 0.08],
];

export function Constellation() {
    const rnd = seeded(7);
    const dust = Array.from({ length: 70 }, () => [rnd() * 480, 20 + rnd() * 290, 0.4 + rnd() * 1.3] as const);
    const at = (id: string) => STARS.find((s) => s.id === id)!;
    return (
        <g>
            <g fill="var(--nb-sepia)" opacity="0.55">
                {dust.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
            </g>
            <g filter="url(#nb-ink)">
                {LINKS.map(([a, b, r]) => {
                    const A = at(a), B = at(b), strong = r > 0.8;
                    return (
                        <path
                            key={a + b}
                            d={`M${A.x} ${A.y}L${B.x} ${B.y}`}
                            stroke={strong ? "var(--nb-chalk)" : "var(--nb-sepia)"}
                            strokeWidth={0.6 + r * 2.4}
                            strokeDasharray={r < 0.4 ? "2 6" : undefined}
                            strokeLinecap="round"
                        />
                    );
                })}
                {STARS.map((s) => (
                    <g key={s.id}>
                        <circle cx={s.x} cy={s.y} r="9" fill="var(--nb-paper)" stroke="var(--nb-ink)" strokeWidth="1.3" />
                        <path d={`M${s.x - 15} ${s.y}h30M${s.x} ${s.y - 15}v30`} stroke="var(--nb-ink)" strokeWidth="0.8" />
                        <text x={s.x + 14} y={s.y - 12} className="nb-note-sm">{s.id}</text>
                    </g>
                ))}
            </g>
            <text x="250" y="300" className="nb-note nb-chalk-text">si muovono insieme · 0.87</text>
            <text x="20" y="10" className="nb-note">Costellazione delle correlazioni</text>
        </g>
    );
}

/* ---------- Study: allocation as stacked stones (local 0–300 × −150–90) ---------- */

export function Stones() {
    const blocks = [[0, 0, 120, 52], [10, -46, 100, 46], [22, -84, 76, 38], [32, -110, 56, 26], [40, -128, 40, 18]];
    const labels = ["azioni 47%", "cripto 30%", "ETF 14%", "oro 9%", "obblig. 0%"];
    return (
        <g>
            <g fill="none" stroke="var(--nb-ink)" strokeWidth="1.2" filter="url(#nb-ink)">
                {blocks.map(([x, y, w, h], i) => (
                    <g key={i}>
                        <rect x={x} y={y} width={w} height={h} rx="3" fill={i === 0 ? "url(#nb-hatch)" : "none"} />
                        <text x={x + w + 10} y={y + h / 2 + 5} className="nb-note-sm" stroke="none">{labels[i]}</text>
                    </g>
                ))}
                <path d="M-10 52H160" />
            </g>
            <text x="-5" y="78" className="nb-note-sm">fig. 3 — il peso di ciascuna parte</text>
        </g>
    );
}

/* ---------- Study: dividers (compass) ---------- */

export function Dividers() {
    return (
        <g fill="none" stroke="var(--nb-ink)" strokeWidth="1.3" filter="url(#nb-ink)">
            <circle cx="0" cy="0" r="9" />
            <path d="M-3 8L-60 210M3 8L64 205" />
            <path d="M-60 210l-3 12M64 205l4 11" />
            <path d="M-40 140Q2 150 44 138" strokeDasharray="3 4" />
            <path d="M-120 230A140 140 0 0 1 130 222" stroke="var(--nb-chalk)" strokeDasharray="1 5" strokeWidth="1.6" />
        </g>
    );
}

/* ---------- Study: a drawdown drawn as a cliff (local 0–520 × 0–320) ---------- */

export function Drawdown() {
    // A price path that climbs, falls off a cliff, then slowly recovers
    const path: [number, number][] = [];
    const rnd = seeded(11);
    for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        let base = t < 0.38 ? 120 - t * 140 : t < 0.5 ? 67 + (t - 0.38) * 1400 : 235 - (t - 0.5) * 220;
        base += (rnd() - 0.5) * 10;
        path.push([30 + t * 470, base]);
    }
    const line = "M" + path.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");
    const peak = path[38], trough = path[50];
    return (
        <g>
            <g filter="url(#nb-ink)">
                <path d={`${line}L500 290L30 290Z`} fill="url(#nb-hatch)" opacity="0.3" />
                <path d={line} fill="none" stroke="var(--nb-ink)" strokeWidth="1.8" />
                <path d="M20 290H510" stroke="var(--nb-ink)" />
                <path d={`M${f(peak[0])} ${f(peak[1])}H${f(trough[0] + 40)}`} stroke="var(--nb-sepia)" strokeDasharray="3 5" />
                <path d={`M${f(trough[0] + 30)} ${f(peak[1])}V${f(trough[1])}`} stroke="var(--nb-chalk)" strokeWidth="1.4" />
                <path d={`M${f(trough[0] + 24)} ${f(trough[1] - 10)}l6 10l6 -10`} stroke="var(--nb-chalk)" fill="none" />
            </g>
            <text x={trough[0] + 42} y={(peak[1] + trough[1]) / 2} className="nb-note nb-chalk-text">la caduta</text>
            <text x={trough[0] + 42} y={(peak[1] + trough[1]) / 2 + 22} className="nb-note-sm nb-chalk-text">peak to trough</text>
            <text x="30" y="30" className="nb-note">Prova di resistenza — marzo 2020</text>
        </g>
    );
}

/* ---------- Study: a sealed letter (privacy) (local 0–420 × 0–300) ---------- */

export function SealedLetter() {
    return (
        <g>
            <g fill="none" stroke="var(--nb-ink)" strokeWidth="1.3" filter="url(#nb-ink)">
                <rect x="40" y="60" width="320" height="200" rx="4" fill="var(--nb-paper)" />
                <path d="M40 60L200 175L360 60" />
                <path d="M40 260L160 150M360 260L240 150" opacity="0.6" />
                {[90, 105, 120].map((y) => (
                    <path key={y} d={`M70 ${y + 120}h${80 - (y - 90)}`} stroke="var(--nb-sepia)" strokeWidth="0.8" />
                ))}
            </g>
            <g transform="translate(200 175)">
                <circle r="34" fill="var(--nb-chalk)" />
                <circle r="26" fill="none" stroke="#7e2f1c" strokeWidth="2" />
                <text y="9" textAnchor="middle" className="nb-seal">RL</text>
            </g>
            <text x="40" y="35" className="nb-note">Ciò che resta sigillato</text>
            <text x="230" y="292" className="nb-note-sm">solo la prova lascia la mano</text>
        </g>
    );
}

/* ---------- The anachronism: a modern phone, sketched in ink ---------- */

export function Phone() {
    return (
        <g>
            {/* Hatched shadow, offset like a drawn cast shadow */}
            <rect x="12" y="14" width="150" height="300" rx="24" fill="url(#nb-hatch)" opacity="0.55" />
            <g filter="url(#nb-ink)" stroke="var(--nb-ink)" fill="none">
                <rect x="0" y="0" width="150" height="300" rx="24" fill="var(--nb-paper)" strokeWidth="1.8" />
                <rect x="9" y="9" width="132" height="282" rx="17" strokeWidth="0.9" />
                <rect x="58" y="16" width="34" height="8" rx="4" fill="var(--nb-ink)" stroke="none" />
                <path d="M-1 70v26M151 82v40" strokeWidth="2.2" strokeLinecap="round" />
                {/* Risk meter: a track with the moderate share filled in red chalk */}
                <path d="M22 128h106" strokeWidth="5" strokeLinecap="round" stroke="var(--nb-line)" opacity="0.6" />
                <path d="M22 128h55" strokeWidth="5" strokeLinecap="round" stroke="var(--nb-chalk)" />
                {/* Share of risk per holding, as inked bars */}
                {[[156, 82], [172, 46], [188, 64]].map(([y, w]) => (
                    <g key={y}>
                        <path d={`M22 ${y}h106`} strokeWidth="1" stroke="var(--nb-line)" />
                        <path d={`M22 ${y}h${w}`} strokeWidth="3" strokeLinecap="round" stroke="var(--nb-sepia)" />
                    </g>
                ))}
                <rect x="22" y="238" width="106" height="32" rx="16" fill="var(--nb-ink)" stroke="none" />
            </g>
            <text x="22" y="64" className="nb-phone-label">overall risk</text>
            <text x="20" y="108" className="nb-phone-score">2.57</text>
            <text x="98" y="108" className="nb-phone-label">/ 5</text>
            <text x="75" y="259" textAnchor="middle" className="nb-phone-cta">Analyze</text>
            <text x="18" y="-18" className="nb-note-sm">strumento del futuro</text>
        </g>
    );
}

/* ---------- Hero sheets: where each study sits on the 1600×900 page ---------- */

export const StudiesBack = () => (
    <Sheet className="nb-study">
        <g transform="translate(80 485)"><BellCurve /></g>
    </Sheet>
);

export const StudiesStars = () => (
    <Sheet className="nb-stars">
        <g transform="translate(1040 120)"><Constellation /></g>
    </Sheet>
);

export const StudiesNotes = () => (
    <Sheet className="nb-notes">
        <g transform="translate(200 150) rotate(-18)"><Dividers /></g>
        <text x="70" y="420" className="nb-note">misura due volte,</text>
        <text x="70" y="446" className="nb-note">investi una.</text>
        {/* Da Vinci wrote right to left: one line, mirrored */}
        <text x="800" y="205" className="nb-note nb-mirror" textAnchor="middle">ogni rischio ha un prezzo</text>
        <g transform="translate(1040 725)"><Stones /></g>
    </Sheet>
);

export const StudiesPhone = () => (
    <Sheet className="nb-phone">
        <g transform="translate(1365 455) rotate(12)"><Phone /></g>
    </Sheet>
);
