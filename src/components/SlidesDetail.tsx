"use client";
import { useRef, useState } from "react";
import SlideCard from "./SlideCard";
import { pictureName, saveCardPictures } from "@/lib/cardImage";
import type { PoemStyle } from "@/lib/poem";

type Props = { slides: string[]; style: PoemStyle; title: string; author: string };

/** A slides poem on its own page: 4:5 picture cards that swipe sideways, with a counter, dots and arrows,
 *  and buttons to save the cards as pictures. It carries data-poem, so Listen highlights lines and moves
 *  to the card being read. */
export default function SlidesDetail({ slides, style, title, author }: Props) {
  const [at, setAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };

  async function save(which: "one" | "all") {
    const picks = (which === "one" ? [at] : slides.map((_, i) => i))
      .map((i) => ({ node: cards.current[i], name: pictureName(title, i + 1, slides.length) }))
      .filter((c): c is { node: HTMLDivElement; name: string } => !!c.node);
    setBusy(true);
    setNote("");
    try {
      const r = await saveCardPictures(picks);
      if (r === "downloaded") setNote(picks.length > 1 ? "Pictures saved to your downloads" : "Picture saved to your downloads");
    } catch {
      setNote("Sorry, the picture couldn't be made. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const arrow = "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white backdrop-blur hover:bg-black/60";
  const multi = slides.length > 1;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <div
          ref={track}
          data-poem
          onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {slides.map((html, i) => (
            <section key={i} aria-label={`Card ${i + 1} of ${slides.length}`} className="w-full shrink-0 snap-center">
              <SlideCard
                html={html}
                style={style}
                author={author}
                title={i === 0 ? title : undefined}
                cardRef={(el) => {
                  cards.current[i] = el;
                }}
              />
            </section>
          ))}
        </div>
        {multi && (
          <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-[rgba(89,89,89,0.24)] px-2 py-0.5 text-[11px] text-white">
            {at + 1}/{slides.length}
          </span>
        )}
        {at > 0 && <button onClick={() => go(at - 1)} aria-label="Previous card" className={`${arrow} left-2`}>‹</button>}
        {at < slides.length - 1 && <button onClick={() => go(at + 1)} aria-label="Next card" className={`${arrow} right-2`}>›</button>}
      </div>

      {multi && (
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Go to card ${i + 1}`} className="-m-1 p-1">
              <span className={`block size-1.5 rounded-full transition ${i === at ? "bg-fg" : "bg-muted/50"}`} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => save("one")} disabled={busy} className="rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-line hover:bg-hover disabled:opacity-50">
          {busy ? "Making picture…" : multi ? "Save this card as a picture" : "Save as a picture"}
        </button>
        {multi && (
          <button onClick={() => save("all")} disabled={busy} className="rounded-full px-4 py-1.5 text-sm text-muted ring-1 ring-line hover:bg-hover hover:text-fg disabled:opacity-50">
            Save all {slides.length}
          </button>
        )}
        {note && <span className="text-sm text-muted">{note}</span>}
      </div>
    </div>
  );
}
