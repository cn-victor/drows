import Link from "next/link";
import PoemCanvas from "./PoemCanvas";
import { defaultStyle } from "@/lib/poem";
import type { Book } from "@/server/books";

/** A book cover in a list: themed like the book, with its title and writer. */
export default function BookCard({ book }: { book: Book }) {
  const style = { ...defaultStyle(book.theme), ambient: "none" as const, align: "center" as const };
  return (
    <Link href={`/b/${book.id}`} className="group block overflow-hidden rounded-r-2xl rounded-l-md shadow-md ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-xl">
      <PoemCanvas style={style} className="aspect-[3/4]">
        <div className="flex aspect-[3/4] flex-col items-center justify-between border-l-[6px] border-black/15 p-6 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--poem-muted)" }}>a book</span>
          <h3 className="text-2xl font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{book.title}</h3>
          <div>
            <p className="italic" style={{ fontFamily: "var(--poem-font)", color: "var(--poem-muted)" }}>{book.author}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--poem-muted)" }}>
              {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
            </p>
          </div>
        </div>
      </PoemCanvas>
    </Link>
  );
}
