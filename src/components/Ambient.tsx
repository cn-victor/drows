"use client";
import { useEffect, useState } from "react";
import type { Ambient as AmbientKind } from "@/lib/themes";

const COUNT: Record<AmbientKind, number> = { none: 0, stars: 70, rain: 60, petals: 18, fireflies: 22, snow: 45, embers: 26 };
const SPEED: Record<AmbientKind, [number, number]> = {
  none: [0, 0], stars: [2, 6], rain: [0.7, 1.4], petals: [9, 16], fireflies: [3, 7], snow: [8, 16], embers: [5, 10],
};

type Dot = { left: number; top: number; d: number; delay: number; s: number };

/** The gentle moving background (stars, rain, petals...). Purely decoration. */
export default function Ambient({ kind }: { kind: AmbientKind }) {
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    const [min, max] = SPEED[kind];
    const next = Array.from({ length: COUNT[kind] }, () => {
      const d = min + Math.random() * (max - min);
      return { left: Math.random() * 100, top: Math.random() * 100, d, delay: -Math.random() * d, s: 5 + Math.random() * 9 };
    });
    // Random positions are made in the browser only, so server and browser never disagree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDots(next);
  }, [kind]);

  if (kind === "none") return null;
  const falls = kind === "rain" || kind === "snow" || kind === "petals" || kind === "embers";
  return (
    <div className={`ambient amb-${kind}`} aria-hidden>
      {dots.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            top: falls ? undefined : `${p.top}%`,
            ["--d" as string]: `${p.d}s`,
            ["--delay" as string]: `${p.delay}s`,
            ["--s" as string]: `${p.s}px`,
          }}
        />
      ))}
    </div>
  );
}
