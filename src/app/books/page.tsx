import Link from "next/link";
import { Suspense } from "react";
import BookRow from "@/components/BookRow";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader, { Tabs } from "@/components/shell/ColumnHeader";
import { currentUser } from "@/server/auth";
import { booksBy, latestBooks } from "@/server/books";

export const metadata = { title: "Books" };

async function Books({ searchParams }: { searchParams: PageProps<"/books">["searchParams"] }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  const tab = me && sp.tab === "mine" ? "mine" : "all";
  const books = tab === "mine" && me ? await booksBy(me.id) : await latestBooks(60);
  return (
    <>
      <ColumnHeader title="Books">
        {me && (
          <Tabs
            active={tab}
            tabs={[
              { id: "all", label: "All books", href: "/books" },
              { id: "mine", label: "My books", href: "/books?tab=mine" },
            ]}
          />
        )}
      </ColumnHeader>
      {me && (
        <div className="border-b border-line px-4 py-3">
          <Link href="/books/new" className="inline-flex h-9 items-center rounded-full bg-fg px-4 text-sm font-bold text-bg hover:opacity-90">+ Start a book</Link>
        </div>
      )}
      {books.length ? (
        books.map((b) => <BookRow key={b.id} book={b} />)
      ) : (
        <p className="px-8 py-12 text-center text-muted">{tab === "mine" ? "You haven't started a book yet." : "No books yet."}</p>
      )}
    </>
  );
}

export default function BooksPage(props: PageProps<"/books">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Books searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
