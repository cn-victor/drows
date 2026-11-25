"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "../Avatar";
import TimeAgo from "../TimeAgo";
import { deleteReply, loadComments, sendReply } from "@/app/actions";
import type { Comment } from "@/server/social";

type Viewer = { id: string; username: string; name: string } | null;

/** Replies for one poem, sliding up from the bottom (phones) or in from the side (computers). */
export default function CommentsSheet({ poemId, authorId, viewer, onClose, onCount }: { poemId: string; authorId: string | null; viewer: Viewer; onClose: () => void; onCount: (n: number) => void }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const list = await loadComments(poemId);
    setComments(list);
    onCount(list.length);
  };
  useEffect(() => {
    // Loads replies from the server (the state updates after the data arrives).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemId]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    const r = await sendReply(poemId, text);
    setBusy(false);
    if (r.error) return setError(r.error);
    setText("");
    await reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-stretch sm:justify-end" onClick={onClose}>
      <section
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75dvh] w-full flex-col rounded-t-3xl bg-bg ring-1 ring-line sm:max-h-none sm:w-[420px] sm:rounded-none"
        aria-label="Replies"
      >
        <header className="relative flex min-h-12 items-center justify-between border-b border-line px-4 py-3">
          <span className="mx-auto h-1 w-10 rounded-full bg-line sm:hidden" />
          <h2 className="absolute left-4 text-lg font-bold sm:static">{comments ? `${comments.length} ${comments.length === 1 ? "reply" : "replies"}` : "Replies"}</h2>
          <button onClick={onClose} aria-label="Close" className="absolute right-3 rounded-full px-2 text-2xl leading-none text-muted hover:bg-hover sm:static">×</button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {comments === null && <p className="p-6 text-center text-muted">Loading…</p>}
          {comments?.length === 0 && <p className="p-8 text-center text-muted">No replies yet. Be the first.</p>}
          {comments
            ?.slice()
            .reverse()
            .map((c) => (
              <article key={c.id} className="flex gap-3 border-b border-line px-4 py-3">
                <Link href={`/u/${c.username}`}><Avatar name={c.name} username={c.username} size={36} /></Link>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-1 text-sm">
                    <Link href={`/u/${c.username}`} className="truncate font-bold hover:underline">{c.name}</Link>
                    <span className="truncate text-muted">@{c.username} · <TimeAgo at={c.createdAt} /></span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-line break-words text-[15px]">{c.body}</p>
                  {(viewer?.id === c.userId || viewer?.id === authorId) && (
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this reply?")) return;
                        await deleteReply(c.id);
                        await reload();
                      }}
                      className="mt-1 text-xs text-muted hover:text-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
        </div>
        {viewer ? (
          <form onSubmit={post} className="flex items-end gap-2 border-t border-line p-3">
            <Avatar name={viewer.name} username={viewer.username} size={32} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={1}
              placeholder="Add a reply…"
              className="max-h-32 min-h-9 flex-1 resize-none rounded-2xl bg-soft px-4 py-2 text-[15px] outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
            />
            <button disabled={busy || !text.trim()} className="h-9 rounded-full bg-accent px-4 text-sm font-bold text-on-accent disabled:opacity-50">
              {busy ? "…" : "Reply"}
            </button>
          </form>
        ) : (
          <p className="border-t border-line p-4 text-sm text-muted">
            <Link href={`/login?next=/p/${poemId}`} className="font-bold text-accent hover:underline">Log in</Link> to reply.
          </p>
        )}
        {error && <p className="px-4 pb-3 text-sm text-red-500">{error}</p>}
      </section>
    </div>
  );
}
