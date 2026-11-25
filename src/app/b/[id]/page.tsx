import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import { BookCover } from "@/components/BookRow";
import ChapterMove from "@/components/ChapterMove";
import { HeartIcon } from "@/components/icons";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader from "@/components/shell/ColumnHeader";
import { excerpt } from "@/lib/poem";
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

  return (
    <>
      <ColumnHeader back title={book.title} subtitle={`${chapters.length} ${chapters.length === 1 ? "chapter" : "chapters"}`} />
      <section className="flex flex-col items-center gap-5 border-b border-line px-4 py-8 text-center sm:flex-row sm:items-start sm:text-left">
        <BookCover book={book} className="w-36" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl font-semibold leading-tight">{book.title}</h1>
          <Link href={`/u/${book.username}`} className="mt-2 inline-flex items-center gap-2 hover:underline">
            <Avatar name={book.author} username={book.username} size={24} />
            <span className="font-bold">{book.author}</span>
            <span className="text-muted">@{book.username}</span>
          </Link>
          {book.description && <p className="mt-3 whitespace-pre-line text-[15px]">{book.description}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            {chapters[0] && (
              <Link href={`/p/${chapters[0].id}`} className="flex h-9 items-center rounded-full bg-accent px-5 font-bold text-on-accent hover:brightness-110">Start reading</Link>
            )}
            {isOwner && (
              <>
                <Link href={`/write?book=${book.id}`} className="flex h-9 items-center rounded-full bg-fg px-4 font-bold text-bg hover:opacity-90">+ Add chapter</Link>
                <Link href={`/b/${book.id}/edit`} className="flex h-9 items-center rounded-full px-4 font-bold ring-1 ring-line hover:bg-hover">Edit book</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <h2 className="border-b border-line px-4 py-3 text-xl font-extrabold">Contents</h2>
      {chapters.length ? (
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id} className="flex items-center gap-4 border-b border-line px-4 py-3 hover:bg-hover/40">
              <span className="w-6 shrink-0 text-center text-muted">{i + 1}</span>
              <Link href={`/p/${c.id}`} className="min-w-0 flex-1">
                <span className="block font-bold hover:underline">{c.title}</span>
                <span className="block truncate text-[15px] text-muted">{excerpt(c.doc, 1)[0]}</span>
              </Link>
              <span className="flex shrink-0 items-center gap-1 text-[13px] text-muted"><HeartIcon size={15} /> {c.likes}</span>
              {isOwner && <ChapterMove bookId={book.id} poemId={c.id} first={i === 0} last={i === chapters.length - 1} />}
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-8 py-12 text-center text-muted">{isOwner ? "No chapters yet. Add your first one." : "No chapters yet."}</p>
      )}
    </>
  );
}

export default function BookPage(props: PageProps<"/b/[id]">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Opening book…</p>}>
        <BookView params={props.params} />
      </Suspense>
    </AppShell>
  );
}
