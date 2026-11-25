import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import BookRow from "@/components/BookRow";
import FollowButton from "@/components/FollowButton";
import { CalendarIcon } from "@/components/icons";
import PersonRow from "@/components/PersonRow";
import { PoemList } from "@/components/PoemCard";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader, { Tabs } from "@/components/shell/ColumnHeader";
import { currentUser, followList, getProfile } from "@/server/auth";
import { booksBy } from "@/server/books";
import { poemsByAuthor, repostsBy } from "@/server/poems";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function generateMetadata(props: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const p = await getProfile(username);
  return p ? { title: `${p.name} (@${p.username})`, description: p.bio || `Poems by ${p.name}` } : { title: "Writer not found" };
}

async function Profile({ params, searchParams }: { params: PageProps<"/u/[username]">["params"]; searchParams: PageProps<"/u/[username]">["searchParams"] }) {
  const [{ username }, sp, me] = await Promise.all([params, searchParams, currentUser()]);
  const profile = await getProfile(decodeURIComponent(username), me?.id);
  if (!profile) notFound();
  const tabs = ["poems", "books", "reposts", "followers", "following"] as const;
  const tab = tabs.find((t) => t === sp.tab) ?? "poems";
  const isMe = me?.id === profile.id;
  const joined = new Date(profile.createdAt);
  const base = `/u/${profile.username}`;

  return (
    <>
      <ColumnHeader back title={profile.name} subtitle={`${profile.poems} ${profile.poems === 1 ? "poem" : "poems"}`} />
      {/* Banner and picture */}
      <div className="h-32 sm:h-48" style={{ background: "linear-gradient(135deg, var(--accent) 0%, #2a1d63 55%, #0b0b12 100%)" }} />
      <div className="px-4">
        <div className="flex items-start justify-between">
          <div className="-mt-[46px] rounded-full ring-4 ring-bg sm:-mt-[68px]">
            <span className="sm:hidden"><Avatar name={profile.name} username={profile.username} size={88} /></span>
            <span className="hidden sm:inline"><Avatar name={profile.name} username={profile.username} size={134} /></span>
          </div>
          <div className="mt-3 flex gap-2">
            {isMe ? (
              <Link href="/settings" className="flex h-9 items-center rounded-full px-4 font-bold ring-1 ring-line hover:bg-hover">Edit profile</Link>
            ) : (
              <FollowButton username={profile.username} following={profile.isFollowing} loggedIn={!!me} />
            )}
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-xl font-extrabold leading-tight">{profile.name}</h2>
          <p className="text-[15px] text-muted">@{profile.username}</p>
        </div>
        {profile.bio && <p className="mt-3 whitespace-pre-line text-[15px]">{profile.bio}</p>}
        <p className="mt-3 flex items-center gap-1 text-[15px] text-muted">
          <CalendarIcon size={18} /> Joined {MONTHS[joined.getMonth()]} {joined.getFullYear()}
        </p>
        <p className="mt-2 flex gap-5 pb-3 text-[15px]">
          <Link href={`${base}?tab=following`} className="hover:underline"><b>{profile.following}</b> <span className="text-muted">Following</span></Link>
          <Link href={`${base}?tab=followers`} className="hover:underline"><b>{profile.followers}</b> <span className="text-muted">Followers</span></Link>
        </p>
      </div>
      <div className="border-b border-line">
        <Tabs
          active={tab}
          tabs={[
            { id: "poems", label: "Poems", href: base },
            { id: "books", label: "Books", href: `${base}?tab=books` },
            { id: "reposts", label: "Reposts", href: `${base}?tab=reposts` },
            { id: "followers", label: "Followers", href: `${base}?tab=followers` },
            { id: "following", label: "Following", href: `${base}?tab=following` },
          ]}
        />
      </div>

      {tab === "poems" && (
        <PoemList
          poems={await poemsByAuthor(profile.id, me?.id)}
          viewerId={me?.id ?? null}
          empty={isMe ? <>You haven&apos;t published a poem yet. <Link href="/write" className="text-accent hover:underline">Write one</Link>.</> : `@${profile.username} hasn't published a poem yet.`}
        />
      )}
      {tab === "reposts" && <PoemList poems={await repostsBy(profile.id, me?.id)} viewerId={me?.id ?? null} empty="No reposts yet." />}
      {tab === "books" && <Books userId={profile.id} isMe={isMe} />}
      {(tab === "followers" || tab === "following") && <People userId={profile.id} which={tab} me={me ? { username: me.username } : null} />}
    </>
  );
}

async function Books({ userId, isMe }: { userId: string; isMe: boolean }) {
  const books = await booksBy(userId);
  return (
    <>
      {isMe && (
        <div className="border-b border-line px-4 py-3">
          <Link href="/books/new" className="inline-flex h-9 items-center rounded-full bg-fg px-4 text-sm font-bold text-bg hover:opacity-90">+ Start a book</Link>
        </div>
      )}
      {books.length ? books.map((b) => <BookRow key={b.id} book={b} />) : <p className="px-8 py-12 text-center text-muted">No books yet.</p>}
    </>
  );
}

async function People({ userId, which, me }: { userId: string; which: "followers" | "following"; me: { username: string } | null }) {
  const people = await followList(userId, which);
  if (!people.length) return <p className="px-8 py-12 text-center text-muted">{which === "followers" ? "No followers yet." : "Not following anyone yet."}</p>;
  return people.map((p) => <PersonRow key={p.username} person={p} showFollow={false} loggedIn={!!me} />);
}

export default function ProfilePage(props: PageProps<"/u/[username]">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Profile params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
