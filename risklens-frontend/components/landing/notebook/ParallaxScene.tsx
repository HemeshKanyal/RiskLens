"use client";

import React, { useEffect, useRef } from "react";

/**
 * Sets --px / --py (−1…1, eased) on its element from the mouse position.
 * Layers inside read them with their own --depth (see .nb-layer in
 * globals.css), so moving the mouse shifts near layers more than far ones.
 * Without a mouse (touch) it drifts slowly instead. Off-screen it pauses;
 * with reduced motion it stays still.
 */
export default function ParallaxScene({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let targetX = 0, targetY = 0, x = 0, y = 0;
        let lastMouse = -Infinity;
        let raf = 0;
        let visible = true;

        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            const rect = el.getBoundingClientRect();
            targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            lastMouse = performance.now();
        };

        const tick = (t: number) => {
            // Idle drift when there's no recent mouse movement
            if (t - lastMouse > 4000) {
                targetX = Math.sin(t / 5200) * 0.35;
                targetY = Math.cos(t / 6800) * 0.25;
            }
            x += (targetX - x) * 0.06;
            y += (targetY - y) * 0.06;
            el.style.setProperty("--px", x.toFixed(4));
            el.style.setProperty("--py", y.toFixed(4));
            raf = visible ? requestAnimationFrame(tick) : 0;
        };

        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !raf) raf = requestAnimationFrame(tick);
        });
        io.observe(el);
        window.addEventListener("pointermove", onMove, { passive: true });
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            io.disconnect();
            window.removeEventListener("pointermove", onMove);
        };
    }, []);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}

export function Depth({ depth, children, className = "" }: { depth: number; children: React.ReactNode; className?: string }) {
    return (
        <div className={`nb-layer ${className}`} style={{ "--depth": depth } as React.CSSProperties}>
            {children}
        </div>
    );
}
