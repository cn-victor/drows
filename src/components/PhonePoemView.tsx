"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import { BackIcon } from "./icons";
import PoemActions from "./PoemActions";
import PoemCanvas from "./PoemCanvas";
import PoemPlayer from "./PoemPlayer";
import SlideCard from "./SlideCard";
import TimeAgo from "./TimeAgo";
import type { PoemStyle } from "@/lib/poem";
import type { Segment } from "@/lib/segments";

type Props = {
  poem: {
    id: string;
    title: string;
    author: string;
    username: string | null;
    caption: string;
    createdAt: number;
    style: PoemStyle;
    likes: number;
    reposts: number;
    gifts: number;
    liked: boolean;
    reposted: boolean;
    saved: boolean;
  };
  slides: string[] | null; // picture cards, or null for a single-page poem
  pageHtml: string; // the whole poem (single-page poems)
  segments: Segment[];
  commentCount: number;
  isOwner: boolean;
  loggedIn: boolean;
  gift: ReactNode; // the gift button (phone style), made on the server
  comments: ReactNode; // the replies list and reply box, shown in a sheet
};

/** Phones: a poem opens full screen, like a photo post on TikTok. The poem in the middle,
 *  like/reply/gift/save/share down the right, the writer, caption and sound at the bottom.
 *  The poem's sound plays by itself (after the reader's first tap on the site). */
export default function PhonePoemView({ poem, slides, pageHtml, segments, commentCount, isOwner, loggedIn, gift, comments }: Props) {
  const router = useRouter();
  const [at, setAt] = useState(0);
  const [more, setMore] = useState(false);
  const [sheet, setSheet] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // While this screen is showing, the page behind it shouldn't scroll.
  useEffect(() => {
    if (!root.current || getComputedStyle(root.current).display === "none") return; // computers
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  // Opened from a "replies" link: show the replies straight away.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (location.hash === "#comments") setSheet(true);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (el && slides) el.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));
  const profile = poem.username ? `/u/${poem.username}` : "#";
  const multi = !!slides && slides.length > 1;
  const longCaption = poem.caption.length > 90 || poem.caption.includes("\n");

  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col bg-black text-white sm:hidden">
      {/* Top */}
      <div className="flex h-12 shrink-0 items-center justify-between px-2">
        <button onClick={back} aria-label="Back" className="rounded-full p-2 hover:bg-white/10">
          <BackIcon size={24} />
        </button>
        {isOwner && (
          <Link href={`/write?edit=${poem.id}`} className="rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-white/40">Edit</Link>
        )}
      </div>

      {/* The poem */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {slides ? (
          <div className="w-full" style={{ maxWidth: "min(100%, calc((100dvh - 250px) * 0.8))" }}>
            <div
              ref={track}
              data-poem-phone
              onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
              className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
            >
              {slides.map((html, i) => (
                <section key={i} aria-label={`Card ${i + 1} of ${slides.length}`} className="w-full shrink-0 snap-center">
                  <SlideCard html={html} style={poem.style} author={poem.author} title={i === 0 ? poem.title : undefined} />
                </section>
              ))}
            </div>
            {multi && (
              <div className="mt-3 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => go(i)} aria-label={`Go to card ${i + 1}`} className="-m-1 p-1">
                    <span className={`block size-1.5 rounded-full transition ${i === at ? "bg-white" : "bg-white/40"}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <PoemCanvas style={poem.style} className="mx-3 max-h-full w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl">
            <div className="px-6 pb-10 pt-8" style={{ textAlign: poem.style.align }}>
              <h1 className="text-3xl font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{poem.title}</h1>
              <div data-poem-phone className="poem-body mt-6" dangerouslySetInnerHTML={{ __html: pageHtml }} />
            </div>
          </PoemCanvas>
        )}
      </div>

      {/* Writer, caption and sound */}
      <div className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pr-20 pt-3">
        <div className="flex items-center gap-2 text-[15px]">
          <Link href={profile} className="truncate font-bold">{poem.author}</Link>
          <span className="shrink-0 text-white/60">· <TimeAgo at={poem.createdAt} /></span>
          {!isOwner && poem.username && <FollowButton username={poem.username} following={false} loggedIn={loggedIn} small />}
        </div>
        {poem.caption && (
          <button onClick={() => setMore((m) => !m)} className="mt-1 block w-full text-left text-[15px] leading-5 text-white/90">
            <span className={`whitespace-pre-line break-words ${more ? "" : "line-clamp-2"}`}>{poem.caption}</span>
            {longCaption && !more && <span className="font-bold text-white"> …more</span>}
          </button>
        )}
        <div className="mt-2.5">
          <PoemPlayer poemId={poem.id} segments={segments} music={poem.style.music} align="left" rootSelector="[data-poem-phone]" autoMusic onDark />
        </div>
      </div>

      {/* Right side: writer and buttons */}
      <div className="absolute bottom-[max(calc(env(safe-area-inset-bottom)+150px),165px)] right-2 flex flex-col items-center gap-5">
        <Link href={profile} aria-label={`${poem.author}'s profile`} className="rounded-full ring-2 ring-white">
          <Avatar name={poem.author} username={poem.username ?? poem.author} size={44} />
        </Link>
        <PoemActions
          vertical
          poemId={poem.id}
          likes={poem.likes}
          reposts={poem.reposts}
          comments={commentCount}
          gifts={poem.gifts}
          liked={poem.liked}
          reposted={poem.reposted}
          saved={poem.saved}
          isOwner={isOwner}
          loggedIn={loggedIn}
          giftSlot={gift}
          onComment={() => setSheet(true)}
        />
      </div>

      {/* Replies, in a sheet that slides up */}
      {sheet && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Replies">
          <button className="absolute inset-0 bg-black/50" aria-label="Close replies" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col overflow-hidden rounded-t-2xl bg-bg text-fg">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <span className="font-bold">{commentCount} {commentCount === 1 ? "reply" : "replies"}</span>
              <button onClick={() => setSheet(false)} className="rounded-full px-3 py-1 text-sm font-bold hover:bg-hover">Close</button>
            </div>
            <div className="min-h-0 overflow-y-auto pb-[env(safe-area-inset-bottom)]">{comments}</div>
          </div>
        </div>
      )}
    </div>
  );
}
