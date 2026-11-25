"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import TimeAgo from "./TimeAgo";
import { postComment, removeComment, type FormState } from "@/app/actions";
import type { Comment } from "@/server/social";

type Props = {
  poemId: string;
  comments: Comment[];
  viewer: { id: string; username: string; name: string } | null;
  isPoemOwner: boolean;
  replyingTo: string | null;
};

/** Replies under a poem, and the box to write one. */
export default function Comments({ poemId, comments, viewer, isPoemOwner, replyingTo }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(postComment.bind(null, poemId), null);
  const form = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText("");
    }
  }, [state]);

  return (
    <section id="comments">
      {viewer ? (
        <form ref={form} action={action} className="flex gap-3 border-b border-line px-4 py-3">
          <Avatar name={viewer.name} username={viewer.username} size={40} />
          <div className="min-w-0 flex-1">
            {replyingTo && <p className="text-[15px] text-muted">Replying to <span className="text-accent">@{replyingTo}</span></p>}
            <textarea
              name="body"
              defaultValue={state?.values?.body}
              onChange={(e) => setText(e.target.value)}
              required
              maxLength={1000}
              rows={2}
              placeholder="Post your reply"
              className="mt-1 w-full resize-none bg-transparent text-xl outline-none placeholder:text-muted"
            />
            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
            <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
              {text.length > 800 && <span className="text-sm text-muted">{1000 - text.length}</span>}
              <button disabled={pending || !text.trim()} className="h-9 rounded-full bg-accent px-4 font-bold text-on-accent transition hover:brightness-110 disabled:opacity-50">
                {pending ? "Replying…" : "Reply"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="border-b border-line px-4 py-4 text-[15px] text-muted">
          <Link href={`/login?next=/p/${poemId}%23comments`} className="font-bold text-accent hover:underline">Log in</Link> to reply.
        </p>
      )}

      {comments
        .slice()
        .reverse()
        .map((c) => (
          <article key={c.id} className="flex gap-3 border-b border-line px-4 py-3 hover:bg-hover/40">
            <Link href={`/u/${c.username}`}><Avatar name={c.name} username={c.username} size={40} /></Link>
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-1 text-[15px] leading-5">
                <Link href={`/u/${c.username}`} className="truncate font-bold hover:underline">{c.name}</Link>
                <span className="truncate text-muted">@{c.username}</span>
                <span className="text-muted">·</span>
                <span className="shrink-0 text-muted"><TimeAgo at={c.createdAt} /></span>
              </p>
              <p className="mt-0.5 whitespace-pre-line break-words text-[15px]">{c.body}</p>
              {(viewer?.id === c.userId || isPoemOwner) && (
                <button onClick={() => confirm("Delete this reply?") && removeComment(c.id)} className="mt-1 text-[13px] text-muted hover:text-red-500">
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
    </section>
  );
}
