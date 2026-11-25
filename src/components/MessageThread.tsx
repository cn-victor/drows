"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import TimeAgo from "./TimeAgo";
import { postMessage, type FormState } from "@/app/actions";
import type { Message } from "@/server/messages";

/** A private conversation: bubbles (yours on the right) and a box to write in. */
export default function MessageThread({ username, name, messages }: { username: string; name: string; messages: Message[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(postMessage.bind(null, username), null);
  const form = useRef<HTMLFormElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText("");
    }
  }, [state]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex min-h-[calc(100vh-53px)] flex-col max-sm:min-h-[calc(100vh-13rem)]">
      <div className="flex-1 space-y-1 px-4 py-4">
        {!messages.length && <p className="py-10 text-center text-muted">Say hello to {name}. Only the two of you can see these messages.</p>}
        {messages.map((m, i) => {
          const lastOfRun = messages[i + 1]?.mine !== m.mine;
          return (
            <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"} ${lastOfRun ? "pb-3" : ""}`}>
              <p className={`max-w-[80%] whitespace-pre-line break-words rounded-3xl px-4 py-2.5 text-[15px] ${m.mine ? "rounded-br-md bg-accent text-on-accent" : "rounded-bl-md bg-soft"}`}>
                {m.body}
              </p>
              {lastOfRun && <span className="mt-1 text-[13px] text-muted"><TimeAgo at={m.at} /></span>}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form ref={form} action={action} className="sticky bottom-0 border-t border-line bg-bg px-3 py-2 max-sm:bottom-[5.5rem] max-sm:border-none max-sm:bg-transparent">
        {state?.error && <p className="px-2 pb-1 text-sm text-red-500">{state.error}</p>}
        <div className="flex items-end gap-2 rounded-3xl bg-soft px-4 py-1.5">
          <textarea
            name="body"
            defaultValue={state?.values?.body}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && text.trim()) {
                e.preventDefault();
                form.current?.requestSubmit();
              }
            }}
            required
            maxLength={2000}
            rows={1}
            placeholder="Start a new message"
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none placeholder:text-muted"
          />
          <button disabled={pending || !text.trim()} className="mb-0.5 rounded-full px-3 py-1.5 text-sm font-bold text-accent disabled:opacity-40">
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
