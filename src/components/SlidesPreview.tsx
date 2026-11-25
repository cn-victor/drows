"use client";
import { useRef, useState, type CSSProperties } from "react";

/** A slides poem inside a feed post: swipe sideways like a multi-photo post, with a counter and dots.
 *  Tapping a slide still opens the poem (the post wraps this in a link); the arrows and dots don't. */
export default function SlidesPreview({ title, author, slides, align }: { title: string; author: string; slides: string[]; align: string }) {
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (!el) return;
    const k = Math.max(0, Math.min(slides.length - 1, i));
    el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
  };
  const arrow = "absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-lg text-white opacity-0 backdrop-blur transition group-hover:opacity-100";

  return (
    <div className="group relative">
      <div
        ref={track}
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((html, i) => (
          <div key={i} className="relative h-80 w-full shrink-0 snap-center overflow-hidden" aria-label={`Slide ${i + 1} of ${slides.length}`}>
            <div className="flex h-full flex-col justify-center px-6 py-8" style={{ textAlign: align as CSSProperties["textAlign"] }}>
              {i === 0 && (
                <div className="mb-4">
                  <h3 className="text-[22px] font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{title}</h3>
                  <p className="mt-0.5 text-sm italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)" }}>by {author}</p>
                </div>
              )}
              {/* Cleaned when saved, so only safe formatting reaches the page. */}
              <div className="poem-body max-h-full overflow-hidden" style={{ ["--poem-size" as string]: "18px", ["--poem-line" as string]: "1.6" }} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        ))}
      </div>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
        {at + 1}/{slides.length}
      </span>
      {at > 0 && <button onClick={(e) => go(e, at - 1)} aria-label="Previous slide" className={`${arrow} left-2`}>‹</button>}
      {at < slides.length - 1 && <button onClick={(e) => go(e, at + 1)} aria-label="Next slide" className={`${arrow} right-2`}>›</button>}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => go(e, i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === at ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
            style={{ boxShadow: "0 0 2px rgba(0,0,0,0.5)" }}
          />
        ))}
      </div>
    </div>
  );
}
