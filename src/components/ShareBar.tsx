"use client";
import Link from "next/link";
import { useState } from "react";

/** Buttons under a poem: share the link, and edit (only for the person who wrote it). */
export default function ShareBar({ id, title, isNew, isOwner }: { id: string; title: string; isNew: boolean; isOwner: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}/p/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // the person closed the share sheet; fall back to copying
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pill = "rounded-full px-4 py-2 text-sm font-medium backdrop-blur transition";
  return (
    <div className="flex flex-col items-center gap-3">
      {isNew && isOwner && <p className="text-sm" style={{ color: "var(--poem-muted)" }}>Your poem is live. Share the link with anyone.</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={share} className={`${pill} hover:opacity-90`} style={{ background: "var(--poem-accent)", color: "var(--poem-on-accent)" }}>
          {copied ? "Link copied ✓" : "Share"}
        </button>
        {isOwner ? (
          <Link href={`/write?edit=${id}`} className={`${pill} ring-1 ring-current/30 hover:bg-white/10`}>
            Edit
          </Link>
        ) : (
          <Link href="/write" className={`${pill} ring-1 ring-current/30 hover:bg-white/10`}>
            Write your own
          </Link>
        )}
      </div>
    </div>
  );
}
