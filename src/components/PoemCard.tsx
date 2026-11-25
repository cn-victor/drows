import Link from "next/link";
import type { ReactNode } from "react";
import Avatar from "./Avatar";
import { BookIcon, RepostIcon } from "./icons";
import PoemActions from "./PoemActions";
import PoemCanvas from "./PoemCanvas";
import TimeAgo from "./TimeAgo";
import { excerpt, slideBlocks, type Poem } from "@/lib/poem";
import { SOUNDSCAPES } from "@/lib/sounds";

/** The poem's first lines on its own theme, like the picture in a post. */
export function PoemPreview({ poem: p, lines = 6 }: { poem: Poem; lines?: number }) {
  const text = excerpt(p.doc, lines);
  const m = p.style.music;
  const slides = p.style.layout === "slides" ? slideBlocks(p.doc, p.style).length : 1;
  const music = m.kind === "scape" ? SOUNDSCAPES.find((s) => s.id === m.id)?.label : m.kind === "upload" ? m.name : null;
  return (
    <PoemCanvas style={{ ...p.style, ambient: "none" }} className="overflow-hidden rounded-2xl border border-line">
      <div className="px-6 py-5" style={{ textAlign: p.style.align }}>
        <h3 className="text-[22px] font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{p.title}</h3>
        <div className="mt-3 space-y-0.5 text-[17px] leading-snug" style={{ fontFamily: "var(--poem-font)" }}>
          {text.map((line, i) => (
            <p key={i} className="overflow-hidden text-ellipsis whitespace-pre">{line}</p>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium" style={{ color: "var(--poem-muted)", fontFamily: "var(--font-modern)" }}>
          {slides > 1 ? `⧉ ${slides} slides` : "Read"}{music ? ` · ♫ ${music}` : ""} · ▶ Listen
        </p>
      </div>
    </PoemCanvas>
  );
}

/** One poem in a feed, laid out like a post: picture, name, @username, time, the poem, and actions. */
export default function PoemPost({ poem: p, viewerId }: { poem: Poem; viewerId: string | null }) {
  const href = `/p/${p.id}`;
  return (
    <article className="relative border-b border-line px-4 pb-2 pt-3 transition hover:bg-hover/40">
      {p.repostedBy && (
        <p className="mb-1 ml-8 flex items-center gap-2 text-[13px] font-bold text-muted">
          <RepostIcon size={15} />
          <Link href={`/u/${p.repostedBy.username}`} className="hover:underline">{p.repostedBy.name}</Link> reposted
        </p>
      )}
      <div className="flex gap-3">
        <Author poem={p}>
          <Avatar name={p.author} username={p.username ?? p.author} size={40} />
        </Author>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1 text-[15px] leading-5">
            <Author poem={p} className="truncate font-bold hover:underline">{p.author}</Author>
            {p.username && <span className="truncate text-muted">@{p.username}</span>}
            <span className="text-muted">·</span>
            <Link href={href} className="shrink-0 text-muted hover:underline"><TimeAgo at={p.createdAt} /></Link>
          </div>
          {p.bookTitle && (
            <Link href={`/b/${p.bookId}`} className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted hover:underline">
              <BookIcon size={13} /> {p.bookTitle} · Chapter {p.chapter}
            </Link>
          )}
          <Link href={href} className="mt-2 block" aria-label={`Read ${p.title}`}>
            <PoemPreview poem={p} />
          </Link>
          <div className="mt-1.5">
            <PoemActions
              poemId={p.id}
              likes={p.likes}
              reposts={p.reposts}
              comments={p.comments}
              gifts={p.gifts}
              liked={p.liked}
              reposted={p.reposted}
              isOwner={!!viewerId && viewerId === p.authorId}
              loggedIn={!!viewerId}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function Author({ poem, className, children }: { poem: Poem; className?: string; children: ReactNode }) {
  return poem.username ? <Link href={`/u/${poem.username}`} className={className}>{children}</Link> : <span className={className}>{children}</span>;
}

/** A list of poem posts, or a friendly message when there are none. */
export function PoemList({ poems, viewerId, empty }: { poems: Poem[]; viewerId: string | null; empty: ReactNode }) {
  if (!poems.length) return <div className="px-8 py-12 text-center text-muted">{empty}</div>;
  return (
    <div>
      {poems.map((p) => (
        <PoemPost key={`${p.id}-${p.repostedBy?.username ?? ""}`} poem={p} viewerId={viewerId} />
      ))}
    </div>
  );
}
