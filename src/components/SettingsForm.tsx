"use client";
import { useActionState } from "react";
import { saveProfile, type FormState } from "@/app/actions";

const input = "w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-black/15 outline-none focus:ring-2 focus:ring-ink";

export default function SettingsForm({ name, bio }: { name: string; bio: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Your name
        <input name="name" defaultValue={name} required maxLength={60} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        About you (shown on your profile)
        <textarea name="bio" defaultValue={bio} maxLength={300} rows={4} className={input} placeholder="A line or two about you and your writing" />
      </label>
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      {state?.ok && !pending && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Saved.</p>}
      <button disabled={pending} className="self-start rounded-full bg-ink px-6 py-2.5 font-medium text-paper hover:opacity-90 disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
