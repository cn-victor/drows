import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Writer from "@/components/Writer";
import { currentUser } from "@/server/auth";
import { getBook } from "@/server/books";
import { getPoem } from "@/server/poems";

export const metadata = { title: "Write" };

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center p-6 text-center text-muted">{children}</div>;
}

async function LoadWriter({ searchParams }: { searchParams: PageProps<"/write">["searchParams"] }) {
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : null;
  const bookParam = typeof sp.book === "string" ? sp.book : null;
  const me = await currentUser();
  if (!me) {
    const here = editId ? `/write?edit=${editId}` : bookParam ? `/write?book=${bookParam}` : "/write";
    redirect(`/login?next=${encodeURIComponent(here)}`);
  }

  const poem = editId ? await getPoem(editId) : null;
  if (editId && (!poem || poem.authorId !== me.id)) {
    return <Notice><p>You can only edit your own poems. <Link href="/write" className="underline">Write a new one</Link>.</p></Notice>;
  }
  const bookId = poem?.bookId ?? bookParam;
  const book = bookId ? await getBook(bookId) : null;
  if (bookId && (!book || book.authorId !== me.id)) {
    return <Notice><p>You can only add chapters to your own books.</p></Notice>;
  }

  return (
    <Writer
      key={poem?.id ?? `new-${book?.id ?? ""}`}
      initial={poem}
      authorName={me.name}
      book={book ? { id: book.id, title: book.title } : null}
    />
  );
}

export default function WritePage(props: PageProps<"/write">) {
  return (
    <Suspense fallback={<Notice>Opening your page…</Notice>}>
      <LoadWriter searchParams={props.searchParams} />
    </Suspense>
  );
}
