import Link from "next/link";
import PoemCanvas from "./PoemCanvas";
import { defaultStyle } from "@/lib/poem";
import type { Book } from "@/server/books";

/** A small themed book cover. */
export function BookCover({ book, className = "w-24" }: { book: Pick<Book, "title" | "theme">; className?: string }) {
  return (
    <PoemCanvas style={{ ...defaultStyle(book.theme), ambient: "none", align: "center" }} className={`aspect-[3/4] shrink-0 rounded-r-lg rounded-l-sm border-l-4 border-black/30 shadow-md ${className}`}>
      <div className="flex aspect-[3/4] items-center justify-center p-2 text-center">
        <span className="line-clamp-4 text-sm font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{book.title}</span>
      </div>
    </PoemCanvas>
  );
}

/** A book in a list: cover, title, writer, chapters and description. */
export default function BookRow({ book }: { book: Book }) {
  return (
    <Link href={`/b/${book.id}`} className="flex gap-4 border-b border-line px-4 py-4 hover:bg-hover/40">
      <BookCover book={book} className="w-20" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-tight">{book.title}</p>
        <p className="text-[15px] text-muted">by {book.author} · @{book.username}</p>
        <p className="mt-0.5 text-sm text-muted">{book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}</p>
        {book.description && <p className="mt-2 line-clamp-2 text-[15px]">{book.description}</p>}
      </div>
    </Link>
  );
}
