"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { login, signup, type FormState } from "@/app/actions";
import { myPoems } from "@/lib/mine";

const input = "w-full rounded-xl bg-bg px-4 py-3 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-accent";

/** The sign-up and log-in forms. */
export default function AuthForm({ mode, next }: { mode: "signup" | "login"; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signup" ? signup : login, null);
  // Poems published from this browser before accounts existed get moved into the account.
  const [claims, setClaims] = useState("[]");
  const v = state?.values ?? {};
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClaims(JSON.stringify(myPoems().map(({ id, editKey }) => ({ id, editKey }))));
  }, []);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="claims" value={claims} />
      {mode === "signup" ? (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Your name (shown on your poems)
            <input name="name" defaultValue={v.name} required maxLength={60} autoComplete="name" className={input} placeholder="e.g. Ada Okafor" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Username
            <div className="flex items-center gap-1 rounded-xl bg-bg pl-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-ink">
              <span className="text-muted">@</span>
              <input
                name="username"
                defaultValue={v.username}
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                autoComplete="username"
                className="w-full rounded-xl bg-transparent py-3 pr-4 text-base outline-none"
                placeholder="ada_writes"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input name="email" defaultValue={v.email} type="email" required autoComplete="email" className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password (at least 8 characters)
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
          </label>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email or username
            <input name="login" defaultValue={v.login} required autoComplete="username" className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input name="password" type="password" required autoComplete="current-password" className={input} />
          </label>
        </>
      )}

      {state?.error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{state.error}</p>}

      <button disabled={pending} className="mt-2 rounded-full bg-ink px-6 py-3 font-medium text-paper transition hover:opacity-90 disabled:opacity-50">
        {pending ? "One moment…" : mode === "signup" ? "Create my account" : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline">Log in</Link></>
        ) : (
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
