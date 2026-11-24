"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setLike, setRepost } from "@/app/actions";

type Props = {
  poemId: string;
  likes: number;
  reposts: number;
  comments: number;
  liked: boolean;
  reposted: boolean;
  isOwner: boolean;
  loggedIn: boolean;
  commentsHref?: string;
  compact?: boolean;
};

/** ♥ like, ↻ repost and 💬 comment counts. Updates instantly, then saves in the background. */
export default function PoemActions(p: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(p.liked);
  const [reposted, setReposted] = useState(p.reposted);
  const [likes, setLikes] = useState(p.likes);
  const [reposts, setReposts] = useState(p.reposts);
  const [note, setNote] = useState("");
  const [, start] = useTransition();

  const act = (kind: "like" | "repost") => (e: React.MouseEvent) => {
    e.preventDefault(); // cards are links; don't open the poem
    e.stopPropagation();
    if (!p.loggedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    if (p.isOwner) {
      setNote(kind === "like" ? "You can't like your own poem" : "You can't repost your own poem");
      return setTimeout(() => setNote(""), 2500);
    }
    const on = kind === "like" ? !liked : !reposted;
    if (kind === "like") {
      setLiked(on);
      setLikes((n) => n + (on ? 1 : -1));
    } else {
      setReposted(on);
      setReposts((n) => n + (on ? 1 : -1));
    }
    start(async () => {
      const r = await (kind === "like" ? setLike : setRepost)(p.poemId, on);
      if (r.error) {
        // put it back if saving failed
        if (kind === "like") {
          setLiked(!on);
          setLikes((n) => n + (on ? -1 : 1));
        } else {
          setReposted(!on);
          setReposts((n) => n + (on ? -1 : 1));
        }
        setNote(r.error === "login" ? "Please log in" : r.error);
        setTimeout(() => setNote(""), 2500);
      }
    });
  };

  const size = p.compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const btn = `inline-flex items-center gap-1.5 rounded-full transition hover:bg-current/10 ${size}`;
  return (
    <div className="relative flex items-center gap-1" style={{ color: "var(--poem-muted, currentColor)" }}>
      <button onClick={act("like")} className={btn} aria-pressed={liked} title="Like" style={liked ? { color: "#e0245e" } : undefined}>
        <span aria-hidden>{liked ? "♥" : "♡"}</span> {likes}
      </button>
      <button onClick={act("repost")} className={btn} aria-pressed={reposted} title="Repost" style={reposted ? { color: "#17a34a" } : undefined}>
        <span aria-hidden>↻</span> {reposts}
      </button>
      {p.commentsHref ? (
        <a href={p.commentsHref} className={btn} title="Comments">
          <span aria-hidden>💬</span> {p.comments}
        </a>
      ) : (
        <span className={btn} title="Comments">
          <span aria-hidden>💬</span> {p.comments}
        </span>
      )}
      {note && <span className="absolute left-0 top-full mt-1 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white">{note}</span>}
    </div>
  );
}
