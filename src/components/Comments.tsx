"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import Avatar from "./Avatar";
import { postComment, removeComment, type FormState } from "@/app/actions";
import type { Comment } from "@/server/social";

const when = (t: number) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d`;
  return new Date(t).toLocaleDateString();
};

/** Comments under a poem, and the box to add one. */
export default function Comments({ poemId, comments, viewerId, isPoemOwner }: { poemId: string; comments: Comment[]; viewerId: string | null; isPoemOwner: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(postComment.bind(null, poemId), null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <section id="comments" className="rounded-3xl bg-white/80 p-6 text-neutral-800 shadow-sm ring-1 ring-black/5 backdrop-blur sm:p-8">
      <h2 className="mb-5 font-display text-2xl font-semibold">
        {comments.length ? `${comments.length} ${comments.length === 1 ? "comment" : "comments"}` : "Comments"}
      </h2>

      <ul className="flex flex-col gap-5">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Link href={`/u/${c.username}`}><Avatar name={c.name} username={c.username} size={36} /></Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <Link href={`/u/${c.username}`} className="font-semibold hover:underline">{c.name}</Link>{" "}
                <span className="text-neutral-500">@{c.username} · {when(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-line break-words">{c.body}</p>
              {(viewerId === c.userId || isPoemOwner) && (
                <button onClick={() => confirm("Delete this comment?") && removeComment(c.id)} className="mt-1 text-xs text-neutral-500 hover:text-red-700">
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {viewerId ? (
        <form ref={form} action={action} className="mt-6 flex flex-col gap-2">
          <textarea
            name="body"
            defaultValue={state?.values?.body}
            required
            maxLength={1000}
            rows={3}
            placeholder="Say something about this poem…"
            className="w-full rounded-xl bg-white px-4 py-3 ring-1 ring-black/15 outline-none focus:ring-2 focus:ring-neutral-800"
          />
          {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
          <button disabled={pending} className="self-end rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
            {pending ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-neutral-600">
          <Link href={`/login?next=/p/${poemId}%23comments`} className="font-medium underline">Log in</Link> to leave a comment.
        </p>
      )}
    </section>
  );
}
