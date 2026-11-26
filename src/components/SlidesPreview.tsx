"use client";
import { useRef, useState } from "react";
import AutoSound from "./AutoSound";
import SlideCard from "./SlideCard";
import type { PoemStyle } from "@/lib/poem";
import { getTheme } from "@/lib/themes";

type Props = { title: string; author: string; slides: string[]; style: PoemStyle; music: string | null };

/** A slides poem inside a feed post: 4:5 picture cards that swipe sideways like a photo post.
 *  The sound sits top left and the counter top right on the card; the dots sit under it.
 *  Tapping a card still opens the poem (the post wraps this in a link); arrows and dots don't. */
export default function SlidesPreview({ title, author, slides, style, music }: Props) {
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };
  const arrow = "absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-lg text-white opacity-0 backdrop-blur transition group-hover:opacity-100";
  const multi = slides.length > 1;
  const muted = getTheme(style.theme).muted;

  return (
    <div>
      <div className="group relative overflow-hidden rounded-2xl">
        <div
          ref={track}
          onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {slides.map((html, i) => (
            <div key={i} className="w-full shrink-0 snap-center" aria-label={`Card ${i + 1} of ${slides.length}`}>
              <SlideCard html={html} style={style} author={author} title={i === 0 ? title : undefined} />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between">
          {music ? (
            <AutoSound music={style.music} label={music} color={muted} className="pointer-events-auto -m-1.5 p-1.5" />
          ) : (
            <span />
          )}
          {multi && (
            <span className="rounded-full bg-[rgba(89,89,89,0.24)] px-2 py-0.5 text-[10px] text-white" style={{ fontFamily: "var(--font-modern)" }}>
              {at + 1}/{slides.length}
            </span>
          )}
        </div>

        {at > 0 && <button onClick={(e) => go(e, at - 1)} aria-label="Previous card" className={`${arrow} left-2`}>‹</button>}
        {at < slides.length - 1 && <button onClick={(e) => go(e, at + 1)} aria-label="Next card" className={`${arrow} right-2`}>›</button>}
      </div>

      {multi && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={(e) => go(e, i)} aria-label={`Go to card ${i + 1}`} className="-m-1 p-1">
              <span className={`block size-1.5 rounded-full transition ${i === at ? "bg-fg" : "bg-muted/50"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
