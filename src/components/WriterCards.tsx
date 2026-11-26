"use client";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import SlideCard from "./SlideCard";
import { pictureName, saveCardPictures } from "@/lib/cardImage";
import { cleanDoc, renderSlides, type DocNode, type PoemStyle } from "@/lib/poem";

/** In the writer (Slides layout): every card exactly as readers will see it, updated as you type.
 *  Warns when a card has too many lines, and saves any card as a picture. */
export default function WriterCards({ editor, style, title, author }: { editor: Editor; style: PoemStyle; title: string; author: string }) {
  const [doc, setDoc] = useState<DocNode>(() => editor.getJSON() as DocNode);
  useEffect(() => {
    const update = () => setDoc(editor.getJSON() as DocNode);
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  const slides = renderSlides(cleanDoc(doc), style);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const [tooLong, setTooLong] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const fit = useCallback((i: number, ok: boolean) => setTooLong((t) => (t[i] === !ok ? t : { ...t, [i]: !ok })), []);
  const name = title.trim() || "Untitled";

  async function save(which: number | "all") {
    const idx = which === "all" ? slides.map((_, i) => i) : [which];
    const picks = idx
      .map((i) => ({ node: nodes.current[i], name: pictureName(name, i + 1, slides.length) }))
      .filter((c): c is { node: HTMLDivElement; name: string } => !!c.node);
    setBusy(which);
    try {
      await saveCardPictures(picks);
    } catch {
      alert("Sorry, the picture couldn't be made. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const long = slides.map((_, i) => i).filter((i) => tooLong[i]);

  return (
    <section className="mt-12 border-t pt-6" style={{ borderColor: "color-mix(in srgb, var(--poem-muted) 35%, transparent)" }} aria-label="Your cards">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2" style={{ fontFamily: "var(--font-modern)" }}>
        <h2 className="text-sm font-bold">
          Your cards · {slides.length}
          <span className="ml-2 font-normal" style={{ color: "var(--poem-muted)" }}>This is exactly how each card will look, and the picture it saves as.</span>
        </h2>
        <button onClick={() => save("all")} disabled={busy !== null} className="rounded-full px-3 py-1 text-xs font-bold ring-1 ring-current disabled:opacity-50">
          {busy === "all" ? "Making pictures…" : `Save all as pictures`}
        </button>
      </div>
      {long.length > 0 && (
        <p className="mb-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm" style={{ fontFamily: "var(--font-modern)" }}>
          {long.length === 1 ? `Card ${long[0] + 1} has` : `Cards ${long.map((i) => i + 1).join(", ")} have`} more lines than fit. Press <b>⧉ New slide</b> to move some lines to a new card.
        </p>
      )}
      <div className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8">
        {slides.map((html, i) => (
          <figure key={i} className="w-[72%] max-w-[300px] shrink-0 snap-start sm:w-[260px]">
            <div className={`overflow-hidden rounded-xl ring-1 ${tooLong[i] ? "ring-2 ring-red-500" : "ring-black/10"}`}>
              <SlideCard
                html={html}
                style={style}
                author={author}
                title={i === 0 ? name : undefined}
                onFit={(ok) => fit(i, ok)}
                cardRef={(el) => {
                  nodes.current[i] = el;
                }}
              />
            </div>
            <figcaption className="mt-1.5 flex items-center justify-between text-xs" style={{ fontFamily: "var(--font-modern)", color: "var(--poem-muted)" }}>
              <span>Card {i + 1}{tooLong[i] ? " · too long" : ""}</span>
              <button onClick={() => save(i)} disabled={busy !== null} className="font-bold hover:underline disabled:opacity-50">
                {busy === i ? "Making…" : "Save picture"}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
