"use client";
import { useRef, useState, type CSSProperties } from "react";
import { WaveformIcon } from "./icons";

type Props = { title: string; author: string; slides: string[]; align: string; music: string | null };

const isEmpty = (html: string) => !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

/** A slides poem inside a feed post (Figma "Poem preview (slides)"): a 300px card that swipes sideways
 *  like a multi-photo post. Sound name top left, counter top right, the writer's signature bottom right,
 *  small dots at the bottom. Tapping a slide still opens the poem (the post wraps this in a link). */
export default function SlidesPreview({ title, author, slides, align, music }: Props) {
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
    <div className="group relative h-[300px]">
      <div
        ref={track}
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((html, i) => {
          const cover = i === 0 && isEmpty(html); // a first slide with only the title
          return (
            <div key={i} className="relative h-full w-full shrink-0 snap-center overflow-hidden" aria-label={`Slide ${i + 1} of ${slides.length}`}>
              <div
                className={`flex h-full flex-col justify-center px-5 pb-10 pt-12 ${cover ? "items-center text-center" : ""}`}
                style={cover ? undefined : { textAlign: align as CSSProperties["textAlign"] }}
              >
                {i === 0 && (
                  <h3 className={`text-2xl font-semibold leading-tight ${cover ? "" : "mb-3"}`} style={{ fontFamily: "var(--poem-font)" }}>
                    {title}
                  </h3>
                )}
                {!cover && (
                  // Cleaned when saved, so only safe formatting reaches the page.
                  <div
                    className="poem-body max-h-full overflow-hidden"
                    style={{ ["--poem-size" as string]: "18px", ["--poem-line" as string]: "1.4" }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top row: the poem's sound on the left, which slide you're on at the right. */}
      <div className="pointer-events-none absolute inset-x-5 top-5 flex items-center justify-between">
        {music ? (
          <span className="flex min-w-0 items-center gap-[3px] text-[13px]" style={{ color: "var(--poem-muted)", fontFamily: "var(--font-modern)" }}>
            <WaveformIcon size={10} className="shrink-0" />
            <span className="truncate">{music}</span>
          </span>
        ) : (
          <span />
        )}
        <span className="rounded-full bg-[rgba(89,89,89,0.24)] px-2 py-0.5 text-[10px] text-white" style={{ fontFamily: "var(--font-modern)" }}>
          {at + 1}/{slides.length}
        </span>
      </div>

      {/* The writer's name, signed at the bottom right. */}
      <span className="pointer-events-none absolute bottom-4 right-5 text-[13px]" style={{ color: "var(--poem-muted)", fontFamily: "var(--font-signature)" }}>
        {author}
      </span>

      {at > 0 && <button onClick={(e) => go(e, at - 1)} aria-label="Previous slide" className={`${arrow} left-2`}>‹</button>}
      {at < slides.length - 1 && <button onClick={(e) => go(e, at + 1)} aria-label="Next slide" className={`${arrow} right-2`}>›</button>}

      <div className="absolute bottom-[13px] left-1/2 flex -translate-x-1/2 items-center gap-1">
        {slides.map((_, i) => (
          <button key={i} onClick={(e) => go(e, i)} aria-label={`Go to slide ${i + 1}`} className="-m-1 p-1">
            <span className={`block size-1 rounded-[3px] transition ${i === at ? "bg-white" : "bg-white/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
