"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { CommentIcon, GiftIcon, HeartIcon, RepostIcon, ShareIcon } from "./icons";
import { setLike, setRepost } from "@/app/actions";

type Props = {
  poemId: string;
  likes: number;
  reposts: number;
  comments: number;
  gifts: number;
  liked: boolean;
  reposted: boolean;
  isOwner: boolean;
  loggedIn: boolean;
  /** On the poem's own page the gift button is a separate component; in feeds it links to the poem. */
  giftSlot?: ReactNode;
  big?: boolean;
};

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : n > 0 ? String(n) : "");

/** The row of 💬 ↻ ♥ 🎁 ↑ buttons under a poem. Likes and reposts update instantly, then save. */
export default function PoemActions(p: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(p.liked);
  const [reposted, setReposted] = useState(p.reposted);
  const [likes, setLikes] = useState(p.likes);
  const [reposts, setReposts] = useState(p.reposts);
  const [note, setNote] = useState("");
  const [, start] = useTransition();

  const flash = (t: string) => {
    setNote(t);
    setTimeout(() => setNote(""), 2500);
  };

  const act = (kind: "like" | "repost") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.loggedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    if (p.isOwner) return flash(kind === "like" ? "You can't like your own poem" : "You can't repost your own poem");
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
      const r = await (kind === "like" ? setLike : setRepost)(p.poemId, on);
      if (r.error) {
        apply(!on); // put it back if saving failed
        flash(r.error === "login" ? "Please log in" : r.error);
      }
    });
  };

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${location.origin}/p/${p.poemId}`;
    if (navigator.share) {
      try {
        return await navigator.share({ url });
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    flash("Link copied");
  }

  const icon = p.big ? 22 : 18.75;
  const text = p.big ? "text-sm" : "text-[13px]";
  return (
    <div className={`relative flex items-center justify-between ${p.big ? "px-2 py-1" : "max-w-[440px] pr-2"}`}>
      <Btn text={text} href={`/p/${p.poemId}#comments`} label="Comments" count={p.comments} color="group-hover:bg-accent/15 text-accent hover:text-accent">
        <CommentIcon size={icon} />
      </Btn>
      <Btn text={text} onClick={act("repost")} label={reposted ? "Undo repost" : "Repost"} count={reposts} active={reposted} color="group-hover:bg-emerald-500/15 text-emerald-500 hover:text-emerald-500">
        <RepostIcon size={icon} filled={reposted} />
      </Btn>
      <Btn text={text} onClick={act("like")} label={liked ? "Unlike" : "Like"} count={likes} active={liked} color="group-hover:bg-pink-500/15 text-pink-500 hover:text-pink-500">
        <HeartIcon size={icon} filled={liked} />
      </Btn>
      {p.giftSlot ?? (
        <Btn text={text} href={`/p/${p.poemId}?gift=1`} label="Send a gift" count={p.gifts} color="group-hover:bg-amber-400/15 text-amber-400 hover:text-amber-400">
          <GiftIcon size={icon} />
        </Btn>
      )}
      <Btn text={text} onClick={share} label="Share" color="group-hover:bg-accent/15 text-accent hover:text-accent">
        <ShareIcon size={icon} />
      </Btn>
      {note && <span className="absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent">{note}</span>}
    </div>
  );
}

type BtnProps = { onClick?: (e: React.MouseEvent) => void; href?: string; color: string; children: ReactNode; label: string; count?: number; active?: boolean; text: string };

/** One action button. `color` is "hover-background active-colour hover-colour". */
function Btn({ onClick, href, color, children, label, count, active, text }: BtnProps) {
  const [hoverBg, activeColor, hoverColor] = color.split(" ");
  const inner = (
    <>
      <span className={`-m-2 rounded-full p-2 transition ${hoverBg}`}>{children}</span>
      {count !== undefined && <span className={`min-w-[1ch] ${text}`}>{fmt(count)}</span>}
    </>
  );
  const cls = `group flex items-center gap-1 transition ${active ? activeColor : "text-muted"} ${hoverColor}`;
  return href ? (
    <Link href={href} aria-label={label} title={label} className={cls} onClick={(e) => e.stopPropagation()}>{inner}</Link>
  ) : (
    <button onClick={onClick} aria-label={label} title={label} aria-pressed={active} className={cls}>{inner}</button>
  );
}
