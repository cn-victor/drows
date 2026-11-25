"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import Avatar from "../Avatar";
import { CommentIcon, HeartIcon, RepostIcon, ShareIcon } from "../icons";
import GiftButton from "../wallet/GiftButton";
import { setFollowing, setLike, setRepost } from "@/app/actions";
import type { ReelPoem } from "@/server/reel";

type Viewer = { id: string; walletAddress: string | null } | null;

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));

/** One round button with its count underneath (white over the poem on phones, themed on computers). */
function RailButton({ onClick, label, count, active, activeClass, children }: { onClick: () => void; label: string; count?: string; active?: boolean; activeClass: string; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} aria-pressed={active} className="group flex flex-col items-center gap-1">
      <span className={`grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition sm:bg-soft sm:text-fg ${active ? activeClass : "group-hover:bg-hover"}`}>{children}</span>
      {count !== undefined && <span className="text-xs font-semibold text-white drop-shadow sm:text-fg sm:drop-shadow-none">{count}</span>}
    </button>
  );
}

/** The column of actions beside each poem: writer (+ follow), like, reply, repost, gift, share. */
export default function ActionRail({ poem: p, viewer, onComments, commentCount }: { poem: ReelPoem; viewer: Viewer; onComments: () => void; commentCount: number }) {
  const router = useRouter();
  const [liked, setLiked] = useState(p.liked);
  const [reposted, setReposted] = useState(p.reposted);
  const [likes, setLikes] = useState(p.likes);
  const [reposts, setReposts] = useState(p.reposts);
  const [following, setFollow] = useState(p.following);
  const [note, setNote] = useState("");
  const [, start] = useTransition();
  const isOwner = !!viewer && viewer.id === p.authorId;

  const flash = (t: string) => {
    setNote(t);
    setTimeout(() => setNote(""), 2200);
  };
  const needLogin = () => {
    if (viewer) return false;
    router.push(`/login?next=/p/${p.id}`);
    return true;
  };

  const toggle = (kind: "like" | "repost") => () => {
    if (needLogin()) return;
    if (isOwner) return flash(kind === "like" ? "You can't like your own poem" : "You can't repost your own poem");
    const on = kind === "like" ? !liked : !reposted;
    const apply = (v: boolean) => {
      if (kind === "like") {
        setLiked(v);
        setLikes((n) => n + (v ? 1 : -1));
      } else {
        setReposted(v);
        setReposts((n) => n + (v ? 1 : -1));
      }
    };
    apply(on);
    start(async () => {
      const r = await (kind === "like" ? setLike : setRepost)(p.id, on);
      if (r.error) {
        apply(!on);
        flash(r.error === "login" ? "Please log in" : r.error);
      }
    });
  };

  async function share() {
    const url = `${location.origin}/p/${p.id}`;
    if (navigator.share) {
      try {
        return await navigator.share({ url, title: p.title });
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    flash("Link copied");
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Writer, with a + to follow */}
      <div className="relative mb-2">
        {p.username ? (
          <Link href={`/u/${p.username}`} aria-label={`${p.author}'s profile`} className="block rounded-full ring-2 ring-white sm:ring-line">
            <Avatar name={p.author} username={p.username} size={48} />
          </Link>
        ) : (
          <Avatar name={p.author} username={p.author} size={48} />
        )}
        {p.username && !isOwner && !following && (
          <button
            aria-label={`Follow ${p.author}`}
            title={`Follow ${p.author}`}
            onClick={() => {
              if (needLogin()) return;
              setFollow(true);
              start(async () => {
                const r = await setFollowing(p.username!, true);
                if (r.error) setFollow(false);
                else flash(`Following ${p.author}`);
              });
            }}
            className="absolute -bottom-2.5 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-accent text-lg font-bold leading-none text-on-accent ring-2 ring-black sm:ring-bg"
          >
            +
          </button>
        )}
      </div>
      <RailButton onClick={toggle("like")} label={liked ? "Unlike" : "Like"} count={fmt(likes)} active={liked} activeClass="!bg-pink-500/20 !text-pink-500">
        <HeartIcon size={26} filled={liked} />
      </RailButton>
      <RailButton onClick={onComments} label="Replies" count={fmt(commentCount)} activeClass="">
        <CommentIcon size={25} />
      </RailButton>
      <RailButton onClick={toggle("repost")} label={reposted ? "Undo repost" : "Repost"} count={fmt(reposts)} active={reposted} activeClass="!bg-emerald-500/20 !text-emerald-500">
        <RepostIcon size={25} filled={reposted} />
      </RailButton>
      {p.authorId && (
        <GiftButton
          variant="rail"
          poemId={p.id}
          writerName={p.author}
          writerHasWallet={!!p.authorHasWallet}
          isOwner={isOwner}
          viewer={viewer}
          giftCount={p.gifts}
        />
      )}
      <RailButton onClick={share} label="Share" count="Share" activeClass="">
        <ShareIcon size={24} />
      </RailButton>
      {note && <span className="absolute right-full top-1/2 mr-3 whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent">{note}</span>}
    </div>
  );
}
