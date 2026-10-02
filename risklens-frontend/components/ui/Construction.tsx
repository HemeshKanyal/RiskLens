/**
 * Faint Renaissance construction lines (compass circles, golden squares,
 * diagonals) to sit behind a framed page, as in the landing hero.
 */
export default function Construction({ className = "" }: { className?: string }) {
    const squares: string[] = [];
    let x = 340, y = 250, s = 220;
    for (let i = 0; i < 6; i++) {
        squares.push(`M${x.toFixed(1)} ${y.toFixed(1)}h${s.toFixed(1)}v${s.toFixed(1)}h${(-s).toFixed(1)}z`);
        const n = s / 1.618;
        if (i % 4 === 0) x += s - n;
        else if (i % 4 === 1) { y += s - n; x += s - n; }
        else if (i % 4 === 2) y += s - n;
        s = n;
    }
    return (
        <svg
            className={`pointer-events-none absolute inset-0 h-full w-full text-line-strong ${className}`}
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
        >
            <g strokeWidth="1" opacity="0.7">
                <path d="M800 0V900M0 450H1600M0 0L1600 900M0 900L1600 0" />
                <circle cx="800" cy="450" r="430" />
                <circle cx="800" cy="450" r="300" strokeDasharray="2 7" />
                <circle cx="800" cy="120" r="330" />
                <circle cx="800" cy="780" r="330" />
                {squares.map((d, i) => <path key={i} d={d} />)}
                {squares.map((d, i) => <path key={`m${i}`} d={d} transform="rotate(180 800 450)" />)}
            </g>
        </svg>
    );
}
