"use client";
import { reorderChapter } from "@/app/actions";

/** ↑ ↓ buttons the writer uses to reorder chapters. */
export default function ChapterMove({ bookId, poemId, first, last }: { bookId: string; poemId: string; first: boolean; last: boolean }) {
  const btn = "grid h-8 w-8 place-items-center rounded-full ring-1 ring-current/20 hover:bg-white/20 disabled:opacity-20";
  return (
    <span className="flex gap-1">
      <button className={btn} disabled={first} title="Move up" onClick={() => reorderChapter(bookId, poemId, -1)}>↑</button>
      <button className={btn} disabled={last} title="Move down" onClick={() => reorderChapter(bookId, poemId, 1)}>↓</button>
    </span>
  );
}
