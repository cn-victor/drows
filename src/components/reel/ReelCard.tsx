"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import ActionRail from "./ActionRail";
import CommentsSheet from "./CommentsSheet";
import { BookIcon } from "../icons";
import PoemCanvas from "../PoemCanvas";
import PoemPlayer from "../PoemPlayer";
import TimeAgo from "../TimeAgo";
import { SOUNDSCAPES } from "@/lib/sounds";
import type { ReelPoem } from "@/server/reel";

type Viewer = { id: string; username: string; name: string; walletAddress: string | null } | null;

/** One poem in the swipe feed: full-screen themed card, slides that swipe sideways,
 *  writer and title at the bottom, and actions down the side. */
export default function ReelCard({ poem: p, viewer, active, near, topInset = false }: { poem: ReelPoem; viewer: Viewer; active: boolean; near: boolean; topInset?: boolean }) {
  const [slide, setSlide] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(p.comments);
  const track = useRef<HTMLDivElement>(null);
  const many = p.slides.length > 1;
  const rootId = `reel-${p.id}`;
  const m = p.style.music;
  const musicName = m.kind === "scape" ? SOUNDSCAPES.find((s) => s.id === m.id)?.label : m.kind === "upload" ? m.name : null;
  const style = near ? p.style : { ...p.style, ambient: "none" as const }; // only animate poems on or next to the screen

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const k = Math.max(0, Math.min(p.slides.length - 1, i));
    el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex h-full w-full items-end justify-center gap-4 sm:items-center sm:py-4">
      {/* The poem card */}
      <PoemCanvas style={style} className="relative h-full w-full sm:aspect-[9/16] sm:h-full sm:w-auto sm:max-w-full sm:rounded-2xl sm:ring-1 sm:ring-line">
        <div id={rootId} className="absolute inset-0">
          {/* Slides (or a single page) */}
          <div
            ref={track}
            onScroll={(e) => {
              const el = e.currentTarget;
              setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
            }}
            className={`no-scrollbar flex h-full ${many ? "snap-x snap-mandatory overflow-x-auto" : "overflow-hidden"}`}
          >
            {p.slides.map((html, i) => (
              <section key={i} className="no-scrollbar h-full w-full shrink-0 snap-center overflow-y-auto" aria-label={many ? `Slide ${i + 1} of ${p.slides.length}` : undefined}>
                <div className="flex min-h-full flex-col justify-center pb-44 pl-7 pr-20 pt-16 sm:px-9">
                  {i === 0 && (
                    <div className="mb-6" style={{ textAlign: p.style.align }}>
                      <h1 className="text-3xl font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{p.title}</h1>
                      <p className="mt-1 text-lg italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)" }}>by {p.author}</p>
                    </div>
                  )}
                  {/* Cleaned when saved, so only safe formatting reaches the page. */}
                  <div className="poem-body" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </section>
            ))}
          </div>

          {/* Top: Listen and slide counter */}
          <div className={`pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4 ${topInset ? "pt-14 sm:pt-4" : ""}`}>
            <div className="pointer-events-auto">
              <PoemPlayer poemId={p.id} segments={p.segments} music={p.style.music} align="left" rootSelector={`#${rootId}`} active={active} />
            </div>
            {many && (
              <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                {slide + 1}/{p.slides.length}
              </span>
            )}
          </div>

          {/* Arrows on computers */}
          {many && slide > 0 && (
            <button onClick={() => goTo(slide - 1)} aria-label="Previous slide" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white backdrop-blur hover:bg-black/60 sm:grid">‹</button>
          )}
          {many && slide < p.slides.length - 1 && (
            <button onClick={() => goTo(slide + 1)} aria-label="Next slide" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white backdrop-blur hover:bg-black/60 sm:grid">›</button>
          )}

          {/* Bottom: writer, title, book, music, and slide dots */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-4 pt-20 text-white">
            {many && (
              <div className="mb-3 flex justify-center gap-1.5">
                {p.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`pointer-events-auto h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            )}
            <div className="pointer-events-auto max-w-[calc(100%-4.5rem)] sm:max-w-full">
              <p className="text-[15px] font-bold">
                {p.username ? <Link href={`/u/${p.username}`} className="hover:underline">@{p.username}</Link> : p.author}
                <span className="font-normal text-white/70"> · <TimeAgo at={p.createdAt} /></span>
              </p>
              <p className="mt-0.5 truncate text-[15px]">{p.title}</p>
              {p.bookTitle && (
                <Link href={`/b/${p.bookId}`} className="mt-1 flex items-center gap-1.5 text-sm text-white/85 hover:underline">
                  <BookIcon size={14} /> {p.bookTitle} · Chapter {p.chapter}
                </Link>
              )}
              {musicName && <p className="mt-1 truncate text-sm text-white/85">♫ {musicName}</p>}
            </div>
          </div>
        </div>

        {/* Actions over the poem on phones */}
        <div className="absolute bottom-24 right-2 sm:hidden">
          <ActionRail poem={p} viewer={viewer} onComments={() => setCommentsOpen(true)} commentCount={commentCount} />
        </div>
      </PoemCanvas>

      {/* Actions beside the poem on computers */}
      <div className="hidden self-end pb-6 sm:block">
        <ActionRail poem={p} viewer={viewer} onComments={() => setCommentsOpen(true)} commentCount={commentCount} />
      </div>

      {commentsOpen && (
        <CommentsSheet
          poemId={p.id}
          authorId={p.authorId}
          viewer={viewer ? { id: viewer.id, username: viewer.username, name: viewer.name } : null}
          onClose={() => setCommentsOpen(false)}
          onCount={setCommentCount}
        />
      )}
    </div>
  );
}
