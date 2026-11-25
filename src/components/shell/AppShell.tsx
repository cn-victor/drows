import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import Avatar from "../Avatar";
import FollowButton from "../FollowButton";
import { BottomNav, MobileTop, SideNav } from "./Nav";
import SearchBox from "./SearchBox";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { latestBooks } from "@/server/books";
import { suggestedWriters } from "@/server/social";

/** Every page's frame: menu on the left, the page in the middle, extras on the right. */
export default function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] justify-center">
      <header className="hidden shrink-0 sm:flex sm:justify-end">
        <Suspense fallback={<div className="w-[88px] xl:w-[260px]" />}>
          <Side />
        </Suspense>
      </header>
      <main className={`min-h-screen w-full min-w-0 border-line pb-20 sm:border-x sm:pb-0 ${wide ? "max-w-[920px]" : "max-w-[600px]"}`}>
        <Suspense fallback={<div className="h-12 sm:hidden" />}>
          <Top />
        </Suspense>
        {children}
      </main>
      {!wide && (
        <aside className="hidden w-[350px] shrink-0 pl-7 lg:block">
          <div className="sticky top-0 flex max-h-screen flex-col gap-4 overflow-y-auto py-2 no-scrollbar">
            <SearchBox />
            <Suspense fallback={null}>
              <RightRail />
            </Suspense>
            <p className="px-4 pb-4 text-xs text-muted">{SITE_NAME} · Poems, books and the voices behind them</p>
          </div>
        </aside>
      )}
      <Suspense fallback={null}>
        <Bottom />
      </Suspense>
    </div>
  );
}

const meLite = async () => {
  const me = await currentUser();
  return me ? { username: me.username, name: me.name } : null;
};

async function Side() {
  return <SideNav me={await meLite()} />;
}
async function Top() {
  return <MobileTop me={await meLite()} />;
}
async function Bottom() {
  return <BottomNav me={await meLite()} />;
}

async function RightRail() {
  const me = await currentUser();
  const [writers, books] = await Promise.all([suggestedWriters(me?.id ?? null), latestBooks(3)]);
  return (
    <>
      {!me && (
        <section className="rounded-2xl border border-line p-4">
          <h2 className="text-xl font-extrabold">New to {SITE_NAME}?</h2>
          <p className="mt-1 text-sm text-muted">Write poems the way you see them, and let readers hear them.</p>
          <Link href="/signup" className="mt-4 flex h-10 items-center justify-center rounded-full bg-fg font-bold text-bg hover:opacity-90">Create account</Link>
          <Link href="/login" className="mt-2 flex h-10 items-center justify-center rounded-full font-bold ring-1 ring-line hover:bg-hover">Log in</Link>
        </section>
      )}
      {writers.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-line">
          <h2 className="px-4 pb-1 pt-3 text-xl font-extrabold">Writers to follow</h2>
          {writers.map((w) => (
            <div key={w.username} className="flex items-center gap-3 px-4 py-3 hover:bg-hover">
              <Link href={`/u/${w.username}`}><Avatar name={w.name} username={w.username} size={40} /></Link>
              <Link href={`/u/${w.username}`} className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-bold hover:underline">{w.name}</span>
                <span className="block truncate text-sm text-muted">@{w.username}</span>
              </Link>
              <FollowButton username={w.username} following={false} loggedIn={!!me} small />
            </div>
          ))}
          <Link href="/explore?tab=writers" className="block px-4 py-3 text-sm text-accent hover:bg-hover">Show more</Link>
        </section>
      )}
      {books.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-line">
          <h2 className="px-4 pb-1 pt-3 text-xl font-extrabold">New books</h2>
          {books.map((b) => (
            <Link key={b.id} href={`/b/${b.id}`} className="block px-4 py-3 hover:bg-hover">
              <span className="block text-xs text-muted">{b.chapters} {b.chapters === 1 ? "chapter" : "chapters"} · by {b.author}</span>
              <span className="block font-bold">{b.title}</span>
            </Link>
          ))}
          <Link href="/books" className="block px-4 py-3 text-sm text-accent hover:bg-hover">Show more</Link>
        </section>
      )}
    </>
  );
}
