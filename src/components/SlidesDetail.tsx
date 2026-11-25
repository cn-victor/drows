"use client";
import { useRef, useState } from "react";

/** A Slides poem on its own page: swipe sideways through the slides, with a counter, dots and arrows.
 *  It carries data-poem, so Listen highlights lines and moves to the slide being read. */
export default function SlidesDetail({ slides }: { slides: string[] }) {
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };
  const arrow = "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white backdrop-blur hover:bg-black/60";

  return (
    <div className="relative mt-6">
      <div
        ref={track}
        data-poem
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((html, i) => (
          <section key={i} aria-label={`Slide ${i + 1} of ${slides.length}`} className="flex min-h-[18rem] w-full shrink-0 snap-center flex-col justify-center px-1 py-6">
            {/* Cleaned when saved, so only safe formatting reaches the page. */}
            <div className="poem-body" dangerouslySetInnerHTML={{ __html: html }} />
          </section>
        ))}
      </div>
      <span className="absolute -top-2 right-0 rounded-full bg-black/45 px-2.5 py-0.5 text-xs font-semibold text-white">
        {at + 1}/{slides.length}
      </span>
      {at > 0 && <button onClick={() => go(at - 1)} aria-label="Previous slide" className={`${arrow} -left-3 sm:-left-6`}>‹</button>}
      {at < slides.length - 1 && <button onClick={() => go(at + 1)} aria-label="Next slide" className={`${arrow} -right-3 sm:-right-6`}>›</button>}
      <div className="mt-2 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === at ? "w-5" : "w-1.5 opacity-40"}`}
            style={{ background: "var(--poem-ink)" }}
          />
        ))}
      </div>
    </div>
  );
}
