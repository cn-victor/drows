import Link from "next/link";
import { Suspense } from "react";
import BookCard from "@/components/BookCard";
import { PoemGrid } from "@/components/PoemCard";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { latestBooks } from "@/server/books";
import { followingFeed, latestPoems } from "@/server/poems";

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse at top, #fbf4e2 0%, #f1e4c6 75%)" }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-20 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">a home for poems &amp; books</p>
        <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight sm:text-7xl">{SITE_NAME}</h1>
        <p className="mt-5 max-w-xl font-serif text-xl italic text-muted">{SITE_TAGLINE}</p>
        <div className="mt-10 flex gap-3">
          <Link href="/signup" className="rounded-full bg-ink px-7 py-3 text-base font-medium text-paper shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            Start writing
          </Link>
          <Link href="#latest" className="rounded-full px-7 py-3 text-base ring-1 ring-black/15 hover:bg-black/5">Read poems</Link>
        </div>
      </div>
    </section>
  );
}

async function Home({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  const tab = me && sp.feed !== "latest" ? "following" : "latest";
  const poems = tab === "following" && me ? await followingFeed(me.id) : await latestPoems(me?.id);
  const books = await latestBooks(8);

  return (
    <>
      {!me && <Hero />}
      <div id="latest" className="mx-auto max-w-6xl px-6 py-12">
        {me && (
          <nav className="mb-8 flex items-center gap-1 border-b border-black/10">
            {(["following", "latest"] as const).map((t) => (
              <Link
                key={t}
                href={t === "following" ? "/" : "/?feed=latest"}
                className={`border-b-2 px-4 py-2.5 text-sm transition ${tab === t ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}
              >
                {t === "following" ? "Following" : "Latest"}
              </Link>
            ))}
          </nav>
        )}
        {!me && <h2 className="mb-6 font-display text-3xl font-semibold">Latest poems</h2>}
        <PoemGrid
          poems={poems}
          viewerId={me?.id ?? null}
          empty={
            tab === "following" ? (
              <>
                Your feed shows poems from writers you follow, and what they repost.{" "}
                <Link href="/?feed=latest" className="underline">Browse the latest poems</Link> to find writers to follow.
              </>
            ) : (
              "No poems yet. Yours could be the first."
            )
          }
        />
        {books.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-3xl font-semibold">Books</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export default function HomePage(props: PageProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<p className="mx-auto max-w-6xl px-6 py-12 text-muted">Gathering poems…</p>}>
          <Home searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
