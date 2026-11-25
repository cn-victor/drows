"use client";
import { useEffect, useRef, useState } from "react";
import ReelCard from "./ReelCard";
import type { ReelPoem } from "@/server/reel";

type Viewer = { id: string; username: string; name: string; walletAddress: string | null } | null;

/** The TikTok-style feed: one poem per screen, swipe or scroll up for the next.
 *  The address bar follows along, so sharing gives the poem you're looking at. */
export default function PoemReel({ poems, viewer, syncUrl = true, topInset = false }: { poems: ReelPoem[]; viewer: Viewer; syncUrl?: boolean; topInset?: boolean }) {
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  // Work out which poem fills the screen.
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [poems.length]);

  useEffect(() => {
    if (!syncUrl || !poems[active]) return;
    const url = `/p/${poems[active].id}`;
    if (location.pathname !== url) history.replaceState(history.state, "", url);
  }, [active, poems, syncUrl]);

  // ↑ ↓ keys move between poems on computers; ← → between slides happens with the arrows on the card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable]")) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "j" && e.key !== "k") return;
      e.preventDefault();
      const next = Math.max(0, Math.min(poems.length - 1, active + (e.key === "ArrowDown" || e.key === "j" ? 1 : -1)));
      box.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, poems.length]);

  if (!poems.length) {
    return <div className="grid h-[calc(100dvh-3.5rem)] place-items-center p-8 text-center text-muted sm:h-screen">No poems here yet.</div>;
  }

  return (
    <div ref={box} className="no-scrollbar h-[calc(100dvh-3.5rem)] snap-y snap-mandatory overflow-y-auto overscroll-y-contain sm:h-screen">
      {poems.map((p, i) => (
        <div key={`${p.id}-${i}`} data-index={i} className="h-full snap-start snap-always">
          <ReelCard poem={p} viewer={viewer} active={i === active} near={Math.abs(i - active) <= 1} topInset={topInset} />
        </div>
      ))}
      <div className="grid h-40 snap-start place-items-center text-sm text-muted">You&apos;re all caught up ✦</div>
    </div>
  );
}
