"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import PoemCanvas from "./PoemCanvas";
import type { PoemStyle } from "@/lib/poem";

const SIZE_SCALE: Record<PoemStyle["size"], number> = { s: 0.88, m: 1, l: 1.16 };

/** Does this slide have no words (so the first slide is a title cover)? */
export const isEmptySlide = (html: string) => !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

type Props = {
  html: string; // one slide, already cleaned when the poem was saved
  style: PoemStyle;
  author: string;
  title?: string; // only on the first card
  /** The element to turn into a picture (just the card: no counter, dots or buttons). */
  cardRef?: Ref<HTMLDivElement>;
  /** Told whether the words fit on the card (used by the writer to warn). */
  onFit?: (fits: boolean) => void;
};

/** One poem card, shaped like a 4:5 photo. Everything inside is sized from the card's own width,
 *  so the same words fit the same way on a phone, a computer, and in the saved picture. */
export default function SlideCard({ html, style, author, title, cardRef, onFit }: Props) {
  const body = useRef<HTMLDivElement>(null);
  const cover = !!title && isEmptySlide(html);
  const k = SIZE_SCALE[style.size] ?? 1;

  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const el = body.current;
    if (!el || !onFit) return;
    const check = () => {
      const ok = el.scrollHeight <= el.clientHeight + 1;
      setFits(ok);
      onFit(ok);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html, title, style, onFit]);

  return (
    <div ref={cardRef} className="w-full" style={{ containerType: "inline-size" }}>
      <PoemCanvas style={{ ...style, ambient: "none" }} className="aspect-[4/5] w-full">
        <div
          ref={body}
          className={`flex h-full flex-col justify-center overflow-hidden ${cover ? "items-center text-center" : ""}`}
          style={{ padding: "9cqw 8cqw 11cqw", textAlign: cover ? undefined : (style.align as CSSProperties["textAlign"]) }}
        >
          {title && (
            <h3
              className="font-semibold"
              style={{ fontFamily: "var(--poem-font)", fontSize: `${7.4 * k}cqw`, lineHeight: 1.2, marginBottom: cover ? 0 : "3.5cqw" }}
            >
              {title}
            </h3>
          )}
          {!cover && (
            <div
              className="poem-body"
              style={{ ["--poem-size" as string]: `${5.2 * k}cqw`, ["--poem-line" as string]: "1.45" }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
        {/* The writer's name, signed at the bottom right, like a photo's watermark. */}
        <span
          className="pointer-events-none absolute"
          style={{ right: "6cqw", bottom: "4.5cqw", fontSize: "4.4cqw", color: "var(--poem-muted)", fontFamily: "var(--font-signature)" }}
        >
          {author}
        </span>
        {!fits && onFit && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-red-500" aria-hidden />}
      </PoemCanvas>
    </div>
  );
}
