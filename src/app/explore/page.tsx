import { Suspense } from "react";
import BookRow from "@/components/BookRow";
import { PoemList } from "@/components/PoemCard";
import PersonRow from "@/components/PersonRow";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader, { Tabs } from "@/components/shell/ColumnHeader";
import SearchBox from "@/components/shell/SearchBox";
import { currentUser } from "@/server/auth";
import { latestBooks } from "@/server/books";
import { getPoems, latestPoems } from "@/server/poems";
import { searchAll, suggestedWriters } from "@/server/social";

export const metadata = { title: "Explore" };

async function Explore({ searchParams }: { searchParams: PageProps<"/explore">["searchParams"] }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tab = sp.tab === "writers" || sp.tab === "books" ? sp.tab : "poems";
  const qs = q ? `q=${encodeURIComponent(q)}&` : "";
  const searching = q.length >= 2;
  const found = searching ? await searchAll(q) : null;

  return (
    <>
      <ColumnHeader>
        <div className="px-4 py-2"><SearchBox defaultValue={q} /></div>
        <Tabs
          active={tab}
          tabs={[
            { id: "poems", label: searching ? "Poems" : "Latest", href: `/explore?${qs}tab=poems` },
            { id: "writers", label: "Writers", href: `/explore?${qs}tab=writers` },
            { id: "books", label: "Books", href: `/explore?${qs}tab=books` },
          ]}
        />
      </ColumnHeader>

      {tab === "poems" && (
        <PoemList
          poems={found ? await getPoems(found.poemIds, me?.id) : await latestPoems(me?.id, 40)}
          viewerId={me?.id ?? null}
          empty={found ? `No poems found for “${q}”.` : "No poems yet."}
        />
      )}
      {tab === "writers" && <Writers q={found ? q : ""} people={found?.people ?? null} me={me ? { id: me.id, username: me.username } : null} />}
      {tab === "books" && <BooksTab q={found ? q : ""} />}
    </>
  );
}

async function Writers({ q, people, me }: { q: string; people: { username: string; name: string; bio: string }[] | null; me: { id: string; username: string } | null }) {
  const list = people ?? (await suggestedWriters(me?.id ?? null, 30));
  if (!list.length) return <p className="px-8 py-12 text-center text-muted">{q ? `No writers found for “${q}”.` : "You're following everyone so far."}</p>;
  return list.map((p) => <PersonRow key={p.username} person={p} showFollow={p.username !== me?.username} loggedIn={!!me} />);
}

async function BooksTab({ q }: { q: string }) {
  const books = (await latestBooks(40)).filter((b) => !q || `${b.title} ${b.author} ${b.description}`.toLowerCase().includes(q.toLowerCase()));
  if (!books.length) return <p className="px-8 py-12 text-center text-muted">{q ? `No books found for “${q}”.` : "No books yet."}</p>;
  return books.map((b) => <BookRow key={b.id} book={b} />);
}

export default function ExplorePage(props: PageProps<"/explore">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Explore searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
