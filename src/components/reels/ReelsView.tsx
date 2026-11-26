"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Comments from "../Comments";
import { BackIcon } from "../icons";
import ReelItem from "./ReelItem";
import type { ReelPoem, ReelViewer } from "@/lib/reel";
import type { Comment } from "@/server/social";

type Tab = "reels" | "friends";

/** Phones: the Reels screen. Opens on the poem you tapped; swipe up for the next one.
 *  Floating tabs at the top: Reels (everyone) and Friends (people you follow).
 *  It opens inside everyone's poems at the one you tapped, so you can swipe up and down.
 *  The poem on screen plays its sound by itself; the others stay quiet. */
export default function ReelsView({ initial, startIndex, viewer }: { initial: ReelPoem[]; startIndex: number; viewer: ReelViewer }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("reels");
  const [items, setItems] = useState<ReelPoem[]>(initial);
  const [active, setActive] = useState(startIndex);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null); // poem whose replies are open
  const [replies, setReplies] = useState<Comment[] | null>(null);

  // Only on phones (on computers this whole screen is hidden): keep the page behind still.
  useEffect(() => {
    if (!root.current || getComputedStyle(root.current).display === "none") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const load = useCallback(async (which: Tab, list: ReelPoem[], exclude: string) => {
    setLoading(true);
    try {
      const last = list[list.length - 1];
      const q = new URLSearchParams({ tab: which, before: String(last ? last.createdAt : Date.now() + 1), exclude });
      const res = await fetch(`/api/reels?${q}`);
      const data = (await res.json()) as { items: ReelPoem[]; login?: boolean };
      setNeedLogin(!!data.login);
      if (!data.items.length) setDone(true);
      setItems((cur) => {
        const seen = new Set(cur.map((p) => p.id));
        return [...cur, ...data.items.filter((p) => !seen.has(p.id))];
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Open at the poem you tapped (newer poems above it, older ones below).
  useLayoutEffect(() => {
    const box = scroller.current;
    if (box) box.scrollTop = startIndex * box.clientHeight;
  }, [startIndex]);

  // Which poem is on screen (and load more when nearing the end).
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root: box, threshold: 0.6 },
    );
    box.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading more poems as you near the end
    if (!loading && !done && active >= items.length - 3) void load(tab, items, "");
  }, [active, items, loading, done, tab, load]);

  function switchTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    setDone(false);
    setNeedLogin(false);
    if (next === "reels") {
      setItems(initial);
      setActive(startIndex);
      requestAnimationFrame(() => {
        if (scroller.current) scroller.current.scrollTop = startIndex * scroller.current.clientHeight;
      });
      return;
    }
    setActive(0);
    scroller.current?.scrollTo({ top: 0 });
    setItems([]);
    void load(next, [], "");
  }

  const openReplies = async (id: string) => {
    setSheet(id);
    setReplies(null);
    const res = await fetch(`/api/poems/${id}/comments`);
    setReplies(((await res.json()) as { comments: Comment[] }).comments);
  };
  const reloadReplies = async () => {
    if (!sheet) return;
    const res = await fetch(`/api/poems/${sheet}/comments`);
    const list = ((await res.json()) as { comments: Comment[] }).comments;
    setReplies(list);
    setItems((cur) => cur.map((p) => (p.id === sheet ? { ...p, comments: list.length } : p)));
  };
  const sheetPoem = items.find((p) => p.id === sheet);

  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <div ref={root} className="fixed inset-0 z-50 bg-black text-white sm:hidden">
      <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {items.map((p, i) => (
          <div key={p.id} data-index={i} className="h-[100dvh] snap-start snap-always">
            {Math.abs(i - active) <= 2 ? (
              <ReelItem poem={p} viewer={viewer} active={i === active && !sheet} onReplies={() => openReplies(p.id)} />
            ) : (
              <div className="h-full" /> // far-away poems aren't drawn, to keep the phone fast
            )}
          </div>
        ))}
        {(needLogin || (done && tab === "friends" && !items.length)) && (
          <div className="flex h-[100dvh] snap-start flex-col items-center justify-center px-8 text-center">
            {needLogin ? (
              <>
                <p className="text-xl font-bold">See poems from people you follow</p>
                <Link href="/login?next=/" className="mt-4 rounded-full bg-white px-6 py-2.5 font-bold text-black">Log in</Link>
              </>
            ) : (
              <>
                <p className="text-xl font-bold">No poems from friends yet</p>
                <p className="mt-2 text-white/70">Follow writers to see their poems here.</p>
                <button onClick={() => switchTab("reels")} className="mt-4 rounded-full bg-white px-6 py-2.5 font-bold text-black">Watch Reels</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating top: back, and the Reels / Friends tabs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center px-2 pt-[max(env(safe-area-inset-top),8px)]">
        <button onClick={back} aria-label="Back" className="pointer-events-auto absolute left-2 rounded-full p-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          <BackIcon size={24} />
        </button>
        <div className="pointer-events-auto flex rounded-full bg-black/35 p-1 backdrop-blur-md">
          {(["reels", "friends"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              aria-pressed={tab === t}
              className={`rounded-full px-4 py-1.5 text-[15px] font-bold transition ${tab === t ? "bg-white text-black" : "text-white/80"}`}
            >
              {t === "reels" ? "Reels" : "Friends"}
            </button>
          ))}
        </div>
      </div>

      {/* Replies, in a sheet that slides up */}
      {sheet && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Replies">
          <button className="absolute inset-0 bg-black/50" aria-label="Close replies" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col overflow-hidden rounded-t-2xl bg-bg text-fg">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <span className="font-bold">
                {replies ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "Replies"}
              </span>
              <button onClick={() => setSheet(null)} className="rounded-full px-3 py-1 text-sm font-bold hover:bg-hover">Close</button>
            </div>
            <div className="min-h-0 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              {replies === null ? (
                <p className="p-6 text-center text-muted">Loading…</p>
              ) : (
                <Comments
                  poemId={sheet}
                  comments={replies}
                  viewer={viewer ? { id: viewer.id, username: viewer.username, name: viewer.name } : null}
                  isPoemOwner={!!viewer && viewer.id === sheetPoem?.authorId}
                  replyingTo={sheetPoem?.username ?? null}
                  onPosted={reloadReplies}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
