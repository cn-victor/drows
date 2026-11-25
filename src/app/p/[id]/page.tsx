import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import Comments from "@/components/Comments";
import FollowButton from "@/components/FollowButton";
import { BookIcon } from "@/components/icons";
import PoemActions from "@/components/PoemActions";
import PoemCanvas from "@/components/PoemCanvas";
import PoemPlayer from "@/components/PoemPlayer";
import SlidesDetail from "@/components/SlidesDetail";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader from "@/components/shell/ColumnHeader";
import TimeAgo from "@/components/TimeAgo";
import GiftButton from "@/components/wallet/GiftButton";
import { excerpt, renderDoc, renderSlides, type Poem } from "@/lib/poem";
import { buildSegments } from "@/lib/segments";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { one } from "@/server/db";
import { chaptersOf, getPoem } from "@/server/poems";
import { commentsOn } from "@/server/social";

export async function generateMetadata(props: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const poem = await getPoem(id);
  if (!poem) return { title: "Poem not found" };
  const description = excerpt(poem.doc, 3).join(" / ");
  return {
    title: `${poem.title} by ${poem.author}`,
    description,
    openGraph: { title: poem.title, description: `${description}\n\nby ${poem.author}`, siteName: SITE_NAME, type: "article" },
  };
}

/** For book chapters: "Chapter 2 of 5", with the chapters before and after. */
async function ChapterNav({ poem }: { poem: Poem }) {
  if (!poem.bookId) return null;
  const chapters = await chaptersOf(poem.bookId);
  const i = chapters.findIndex((c) => c.id === poem.id);
  const prev = chapters[i - 1];
  const next = chapters[i + 1];
  return (
    <div className="border-b border-line px-4 py-3">
      <Link href={`/b/${poem.bookId}`} className="inline-flex items-center gap-1.5 text-[15px] text-muted hover:underline">
        <BookIcon size={16} /> {poem.bookTitle} · Chapter {i + 1} of {chapters.length}
      </Link>
      {(prev || next) && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {prev ? (
            <Link href={`/p/${prev.id}`} className="rounded-xl p-3 ring-1 ring-line hover:bg-hover">
              <span className="text-muted">← Previous</span>
              <span className="mt-0.5 block truncate font-bold">{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/p/${next.id}`} className="rounded-xl p-3 text-right ring-1 ring-line hover:bg-hover">
              <span className="text-muted">Next →</span>
              <span className="mt-0.5 block truncate font-bold">{next.title}</span>
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}

async function PoemView({ params, searchParams }: { params: PageProps<"/p/[id]">["params"]; searchParams: PageProps<"/p/[id]">["searchParams"] }) {
  const [{ id }, sp, me] = await Promise.all([params, searchParams, currentUser()]);
  const poem = await getPoem(id, me?.id);
  if (!poem) notFound();
  const { style } = poem;
  const isOwner = !!me && me.id === poem.authorId;
  const slides = renderSlides(poem.doc, style); // one item for a single-page poem
  const [comments, writer] = await Promise.all([
    commentsOn(poem.id),
    poem.authorId ? one("SELECT wallet_address FROM users WHERE id = ?", [poem.authorId]) : null,
  ]);
  const stats = [
    [poem.reposts, poem.reposts === 1 ? "Repost" : "Reposts"],
    [poem.likes, poem.likes === 1 ? "Like" : "Likes"],
    [poem.gifts, poem.gifts === 1 ? "Gift" : "Gifts"],
  ].filter(([n]) => Number(n) > 0) as [number, string][];

  return (
    <>
      <ColumnHeader back title={poem.bookId ? "Chapter" : "Poem"} />
      {sp.new === "1" && isOwner && (
        <p className="border-b border-line bg-accent/15 px-4 py-3 text-[15px]">Your poem is live. Share it with the ↑ button below.</p>
      )}
      <ChapterNav poem={poem} />

      <article className="px-4 pt-3">
        {/* Writer */}
        <div className="flex items-center gap-3">
          <Link href={poem.username ? `/u/${poem.username}` : "#"}><Avatar name={poem.author} username={poem.username ?? poem.author} size={40} /></Link>
          <Link href={poem.username ? `/u/${poem.username}` : "#"} className="min-w-0 flex-1 leading-tight">
            <span className="block truncate font-bold hover:underline">{poem.author}</span>
            {poem.username && <span className="block truncate text-[15px] text-muted">@{poem.username}</span>}
          </Link>
          {isOwner ? (
            <Link href={`/write?edit=${poem.id}`} className="flex h-8 items-center rounded-full px-4 text-sm font-bold ring-1 ring-line hover:bg-hover">Edit</Link>
          ) : (
            poem.username && <FollowButton username={poem.username} following={false} loggedIn={!!me} small />
          )}
        </div>

        {/* The poem, on its own theme, with music and the reader */}
        <PoemCanvas style={style} className="mt-3 overflow-hidden rounded-2xl border border-line">
          <div className="px-6 pb-10 pt-8 sm:px-10">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ fontFamily: "var(--poem-font)", textAlign: style.align }}>
              {poem.title}
            </h1>
            <p className="mt-1 text-lg italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)", textAlign: style.align }}>
              by {poem.author}
            </p>
            <div className="mt-5">
              <PoemPlayer poemId={poem.id} segments={buildSegments(poem.doc)} music={style.music} align={style.align} />
            </div>
            {/* The poem was cleaned when it was saved and loaded, so only safe formatting reaches the page. */}
            {slides.length > 1 ? (
              <SlidesDetail slides={slides} />
            ) : (
              <div data-poem className="poem-body mt-8" dangerouslySetInnerHTML={{ __html: renderDoc(poem.doc) }} />
            )}
          </div>
        </PoemCanvas>

        <p className="mt-4 text-[15px] text-muted"><TimeAgo at={poem.createdAt} long /></p>
        {stats.length > 0 && (
          <p className="mt-3 flex gap-5 border-t border-line py-3 text-[15px]">
            {stats.map(([n, label]) => (
              <span key={label}><b>{n}</b> <span className="text-muted">{label}</span></span>
            ))}
          </p>
        )}
        <div className="mt-3 border-y border-line py-1">
          <PoemActions
            big
            poemId={poem.id}
            likes={poem.likes}
            reposts={poem.reposts}
            comments={comments.length}
            gifts={poem.gifts}
            liked={poem.liked}
            reposted={poem.reposted}
            saved={poem.saved}
            isOwner={isOwner}
            loggedIn={!!me}
            giftSlot={
              poem.authorId ? (
                <GiftButton
                  poemId={poem.id}
                  writerName={poem.author}
                  writerHasWallet={!!writer?.wallet_address}
                  isOwner={isOwner}
                  viewer={me ? { id: me.id, walletAddress: me.walletAddress } : null}
                  giftCount={poem.gifts}
                  autoOpen={sp.gift === "1"}
                />
              ) : undefined
            }
          />
        </div>
      </article>

      <Comments
        poemId={poem.id}
        comments={comments}
        viewer={me ? { id: me.id, username: me.username, name: me.name } : null}
        isPoemOwner={isOwner}
        replyingTo={poem.username}
      />
    </>
  );
}

export default function PoemPage(props: PageProps<"/p/[id]">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Opening poem…</p>}>
        <PoemView params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
