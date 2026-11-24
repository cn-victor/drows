"use client";
import { useActionState, useState } from "react";
import { saveBook, type FormState } from "@/app/actions";
import { FONTS } from "@/lib/fonts";
import { THEMES } from "@/lib/themes";

const input = "w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-black/15 outline-none focus:ring-2 focus:ring-ink";

/** Create or edit a book: title, description and cover theme. */
export default function BookForm({ book }: { book?: { id: string; title: string; description: string; theme: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBook.bind(null, book?.id ?? null), null);
  const [theme, setTheme] = useState(book?.theme ?? "parchment");

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Book title
        <input name="title" required maxLength={120} defaultValue={book?.title} className={input} placeholder="e.g. Letters to the Rain" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        What it&apos;s about
        <textarea name="description" maxLength={1000} rows={4} defaultValue={book?.description} className={input} placeholder="A short description readers see on the book's page" />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Cover look</legend>
        <input type="hidden" name="theme" value={theme} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex h-24 items-end rounded-r-xl rounded-l-sm border-l-4 border-black/20 p-2 text-left text-sm transition ${theme === t.id ? "ring-2 ring-ink ring-offset-2" : "ring-1 ring-black/10"}`}
              style={{ background: t.background, color: t.ink, fontFamily: FONTS.find((f) => f.key === t.font)?.css }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </fieldset>
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      <button disabled={pending} className="self-start rounded-full bg-ink px-6 py-3 font-medium text-paper hover:opacity-90 disabled:opacity-50">
        {pending ? "Saving…" : book ? "Save book" : "Create book"}
      </button>
    </form>
  );
}
