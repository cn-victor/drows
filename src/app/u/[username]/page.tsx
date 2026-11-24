import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import BookCard from "@/components/BookCard";
import FollowButton from "@/components/FollowButton";
import { PoemGrid } from "@/components/PoemCard";
import SiteHeader from "@/components/SiteHeader";
import { currentUser, followList, getProfile } from "@/server/auth";
import { booksBy } from "@/server/books";
import { poemsByAuthor, repostsBy } from "@/server/poems";

const TABS = [
  { id: "poems", label: "Poems" },
  { id: "books", label: "Books" },
  { id: "reposts", label: "Reposts" },
  { id: "followers", label: "Followers" },
  { id: "following", label: "Following" },
] as const;

export async function generateMetadata(props: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const p = await getProfile(username);
  return p ? { title: `${p.name} (@${p.username})`, description: p.bio || `Poems by ${p.name}` } : { title: "Writer not found" };
}

async function Profile({ params, searchParams }: { params: PageProps<"/u/[username]">["params"]; searchParams: PageProps<"/u/[username]">["searchParams"] }) {
  const [{ username }, sp, me] = await Promise.all([params, searchParams, currentUser()]);
  const profile = await getProfile(decodeURIComponent(username), me?.id);
  if (!profile) notFound();
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "poems";
  const isMe = me?.id === profile.id;

  return (
    <>
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar name={profile.name} username={profile.username} size={96} />
        <div className="flex-1">
          <h1 className="font-display text-4xl font-semibold">{profile.name}</h1>
          <p className="text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-3 max-w-xl whitespace-pre-line font-serif text-lg">{profile.bio}</p>}
          <p className="mt-3 flex justify-center gap-5 text-sm sm:justify-start">
            <span><b>{profile.poems}</b> poems</span>
            <Link href="?tab=followers" className="hover:underline"><b>{profile.followers}</b> followers</Link>
            <Link href="?tab=following" className="hover:underline"><b>{profile.following}</b> following</Link>
          </p>
        </div>
        <div className="flex gap-2">
          {isMe ? (
            <>
              <Link href="/books/new" className="rounded-full px-4 py-2 text-sm ring-1 ring-black/15 hover:bg-black/5">New book</Link>
              <Link href="/settings" className="rounded-full px-4 py-2 text-sm ring-1 ring-black/15 hover:bg-black/5">Edit profile</Link>
            </>
          ) : (
            <FollowButton username={profile.username} following={profile.isFollowing} loggedIn={!!me} />
          )}
        </div>
      </section>

      <nav className="mt-10 flex gap-1 overflow-x-auto border-b border-black/10">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${tab === t.id ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "poems" && (
          <PoemGrid
            poems={await poemsByAuthor(profile.id, me?.id)}
            viewerId={me?.id ?? null}
            empty={isMe ? <>You haven&apos;t published a poem yet. <Link href="/write" className="underline">Write one</Link>.</> : "No poems yet."}
          />
        )}
        {tab === "reposts" && <PoemGrid poems={await repostsBy(profile.id, me?.id)} viewerId={me?.id ?? null} empty="No reposts yet." />}
        {tab === "books" && <Books userId={profile.id} isMe={isMe} />}
        {(tab === "followers" || tab === "following") && <People userId={profile.id} which={tab} />}
      </div>
    </>
  );
}

async function Books({ userId, isMe }: { userId: string; isMe: boolean }) {
  const books = await booksBy(userId);
  if (!books.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-muted">
        {isMe ? <>No books yet. <Link href="/books/new" className="underline">Start a book</Link> and add poems or chapters to it.</> : "No books yet."}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((b) => <BookCard key={b.id} book={b} />)}
    </div>
  );
}

async function People({ userId, which }: { userId: string; which: "followers" | "following" }) {
  const people = await followList(userId, which);
  if (!people.length) return <p className="text-center text-muted">{which === "followers" ? "No followers yet." : "Not following anyone yet."}</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {people.map((p) => (
        <li key={p.username}>
          <Link href={`/u/${p.username}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-black/5">
            <Avatar name={p.name} username={p.username} />
            <span>
              <span className="block font-medium">{p.name}</span>
              <span className="text-sm text-muted">@{p.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ProfilePage(props: PageProps<"/u/[username]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <Suspense fallback={<p className="text-muted">Opening profile…</p>}>
          <Profile params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
