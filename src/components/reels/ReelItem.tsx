"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import Avatar from "../Avatar";
import FollowButton from "../FollowButton";
import PoemActions from "../PoemActions";
import PoemCanvas from "../PoemCanvas";
import PoemPlayer from "../PoemPlayer";
import SlideCard from "../SlideCard";
import TimeAgo from "../TimeAgo";
import GiftButton from "../wallet/GiftButton";
import type { ReelPoem, ReelViewer } from "@/lib/reel";

type Props = {
  poem: ReelPoem;
  viewer: ReelViewer;
  active: boolean; // the poem on screen: only it plays sound
  onReplies: () => void;
};

/** One poem on the Reels screen, filling the whole phone screen: the words on the poem's own
 *  background, buttons down the right, the writer, caption and sound at the bottom. */
export default function ReelItem({ poem, viewer, active, onReplies }: Props) {
  const [at, setAt] = useState(0);
  const [more, setMore] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const slides = poem.slides;
  const multi = !!slides && slides.length > 1;
  const isOwner = !!viewer && viewer.id === poem.authorId;
  const profile = poem.username ? `/u/${poem.username}` : "#";
  const longCaption = poem.caption.length > 90 || poem.caption.includes("\n");
  const go = (i: number) => {
    const el = track.current;
    if (el && slides) el.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };

  return (
    <PoemCanvas style={{ ...poem.style, ambient: active ? poem.style.ambient : "none" }} className="h-full w-full">
      <div className="relative flex h-full flex-col">
        {/* The poem, full screen */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-44 pt-16" data-reel={poem.id}>
          {slides ? (
            <div className="w-full pl-2 pr-14" style={{ maxWidth: "min(100%, calc((100dvh - 240px) * 0.8 + 64px))" }}>
              <div
                ref={track}
                onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
                className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
              >
                {slides.map((html, i) => (
                  <section key={i} aria-label={`Card ${i + 1} of ${slides.length}`} className="w-full shrink-0 snap-center">
                    <SlideCard bare html={html} style={poem.style} author={poem.author} title={i === 0 ? poem.title : undefined} />
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-scrollbar max-h-full w-full overflow-y-auto pl-7 pr-16" style={{ textAlign: poem.style.align }}>
              <h1 className="text-3xl font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{poem.title}</h1>
              <div className="poem-body mt-6" dangerouslySetInnerHTML={{ __html: poem.pageHtml }} />
              <p className="mt-6 text-right text-base" style={{ color: "var(--poem-muted)", fontFamily: "var(--font-signature)" }}>{poem.author}</p>
            </div>
          )}
        </div>

        {/* Bottom: dots, writer, caption, sound (on a soft dark shade so it's readable on any theme) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(env(safe-area-inset-bottom),14px)] text-white">
          {multi && (
            <div className="mb-3 flex justify-center gap-1.5 pr-14">
              {slides!.map((_, i) => (
                <button key={i} onClick={() => go(i)} aria-label={`Go to card ${i + 1}`} className="-m-1 p-1">
                  <span className={`block size-1.5 rounded-full shadow transition ${i === at ? "bg-white" : "bg-white/45"}`} />
                </button>
              ))}
            </div>
          )}
          <div className="pr-16">
            <div className="flex items-center gap-2 text-[15px] drop-shadow">
              <Link href={profile} className="truncate font-bold">{poem.author}</Link>
              <span className="shrink-0 text-white/70">· <TimeAgo at={poem.createdAt} /></span>
              {isOwner ? (
                <Link href={`/write?edit=${poem.id}`} className="rounded-full px-3 py-1 text-xs font-bold ring-1 ring-white/50">Edit</Link>
              ) : (
                poem.username && <FollowButton username={poem.username} following={false} loggedIn={!!viewer} small />
              )}
            </div>
            {poem.caption && (
              <button onClick={() => setMore((m) => !m)} className="mt-1 block w-full text-left text-[15px] leading-5 drop-shadow">
                <span className={`whitespace-pre-line break-words ${more ? "" : "line-clamp-2"}`}>{poem.caption}</span>
                {longCaption && !more && <span className="font-bold"> …more</span>}
              </button>
            )}
            <div className="mt-2.5">
              <PoemPlayer poemId={poem.id} segments={poem.segments} music={poem.style.music} align="left" rootSelector={`[data-reel="${poem.id}"]`} active={active} autoMusic onDark />
            </div>
          </div>
        </div>

        {/* Right side: writer and buttons */}
        <div className="absolute bottom-[max(calc(env(safe-area-inset-bottom)+130px),145px)] right-2 flex flex-col items-center gap-5">
          <Link href={profile} aria-label={`${poem.author}'s profile`} className="rounded-full ring-2 ring-white">
            <Avatar name={poem.author} username={poem.username ?? poem.author} size={44} />
          </Link>
          <PoemActions
            vertical
            poemId={poem.id}
            likes={poem.likes}
            reposts={poem.reposts}
            comments={poem.comments}
            gifts={poem.gifts}
            liked={poem.liked}
            reposted={poem.reposted}
            saved={poem.saved}
            isOwner={isOwner}
            loggedIn={!!viewer}
            onComment={onReplies}
            giftSlot={
              poem.authorId ? (
                <GiftButton
                  vertical
                  poemId={poem.id}
                  writerName={poem.author}
                  writerHasWallet={poem.authorHasWallet}
                  isOwner={isOwner}
                  viewer={viewer ? { id: viewer.id, walletAddress: viewer.walletAddress } : null}
                  giftCount={poem.gifts}
                />
              ) : undefined
            }
          />
        </div>
      </div>
    </PoemCanvas>
  );
}
