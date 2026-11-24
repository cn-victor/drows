import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ChapterMove from "@/components/ChapterMove";
import PoemCanvas from "@/components/PoemCanvas";
import SiteHeader from "@/components/SiteHeader";
import { defaultStyle, excerpt } from "@/lib/poem";
import { currentUser } from "@/server/auth";
import { getBook } from "@/server/books";
import { chaptersOf } from "@/server/poems";

export async function generateMetadata(props: PageProps<"/b/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const book = await getBook(id);
  return book ? { title: `${book.title} by ${book.author}`, description: book.description } : { title: "Book not found" };
}

async function BookView({ params }: { params: PageProps<"/b/[id]">["params"] }) {
  const { id } = await params;
  const [book, me] = await Promise.all([getBook(id), currentUser()]);
  if (!book) notFound();
  const chapters = await chaptersOf(book.id, me?.id);
  const isOwner = me?.id === book.authorId;
  const style = { ...defaultStyle(book.theme), align: "center" as const };

  return (
    <PoemCanvas style={style} className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--poem-muted)" }}>a book by</p>
        <Link href={`/u/${book.username}`} className="mt-1 inline-block italic hover:underline" style={{ fontFamily: "var(--poem-font)", color: "var(--poem-muted)" }}>
          {book.author}
        </Link>
        <h1 className="mt-6 text-5xl font-semibold leading-tight sm:text-6xl" style={{ fontFamily: "var(--poem-font)" }}>{book.title}</h1>
        {book.description && (
          <p className="mx-auto mt-6 max-w-lg whitespace-pre-line text-lg leading-relaxed" style={{ fontFamily: "var(--poem-font)" }}>{book.description}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {chapters[0] && (
            <Link href={`/p/${chapters[0].id}`} className="rounded-full px-6 py-2.5 text-sm font-medium" style={{ background: "var(--poem-accent)", color: "var(--poem-on-accent)" }}>
              Start reading
            </Link>
          )}
          {isOwner && (
            <>
              <Link href={`/write?book=${book.id}`} className="rounded-full px-5 py-2.5 text-sm ring-1 ring-current/30 hover:bg-white/10">+ Add chapter</Link>
              <Link href={`/b/${book.id}/edit`} className="rounded-full px-5 py-2.5 text-sm ring-1 ring-current/30 hover:bg-white/10">Edit book</Link>
            </>
          )}
        </div>

        <h2 className="mb-4 mt-16 text-xs uppercase tracking-[0.3em]" style={{ color: "var(--poem-muted)" }}>Contents</h2>
        {chapters.length ? (
          <ol className="flex flex-col gap-2 text-left">
            {chapters.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl p-4 ring-1 ring-current/15">
                <span className="w-8 shrink-0 text-center text-sm" style={{ color: "var(--poem-muted)" }}>{i + 1}</span>
                <Link href={`/p/${c.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="block text-xl" style={{ fontFamily: "var(--poem-font)" }}>{c.title}</span>
                  <span className="block truncate text-sm" style={{ color: "var(--poem-muted)" }}>{excerpt(c.doc, 1)[0]}</span>
                </Link>
                <span className="shrink-0 text-xs" style={{ color: "var(--poem-muted)" }}>♥ {c.likes}</span>
                {isOwner && <ChapterMove bookId={book.id} poemId={c.id} first={i === 0} last={i === chapters.length - 1} />}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ color: "var(--poem-muted)" }}>{isOwner ? "No chapters yet. Add your first one." : "No chapters yet."}</p>
        )}
      </div>
    </PoemCanvas>
  );
}

export default function BookPage(props: PageProps<"/b/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<p className="p-12 text-center text-muted">Opening book…</p>}>
          <BookView params={props.params} />
        </Suspense>
      </main>
    </>
  );
}
