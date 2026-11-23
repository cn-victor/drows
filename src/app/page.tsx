import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import MyPoems from "@/components/MyPoems";
import PoemCanvas from "@/components/PoemCanvas";
import { excerpt } from "@/lib/poem";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { latestPoems } from "@/server/db";

async function Latest() {
  await connection(); // always show the newest poems
  const poems = await latestPoems(24);
  if (!poems.length) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-muted">
        No poems yet. Yours could be the first.
      </p>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {poems.map((p) => (
        <Link key={p.id} href={`/p/${p.id}`} className="group block overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <PoemCanvas style={{ ...p.style, ambient: "none" }} className="h-64">
            <div className="flex h-64 flex-col p-6" style={{ textAlign: p.style.align }}>
              <h3 className="text-2xl font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{p.title}</h3>
              <p className="mt-1 text-sm italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)" }}>by {p.author}</p>
              <div className="mt-4 space-y-0.5 overflow-hidden text-[17px] leading-snug opacity-90" style={{ fontFamily: "var(--poem-font)", whiteSpace: "pre-wrap" }}>
                {excerpt(p.doc, 4).map((line, i) => (
                  <p key={i} className="overflow-hidden text-ellipsis whitespace-pre">{line}</p>
                ))}
              </div>
            </div>
          </PoemCanvas>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse at top, #fbf4e2 0%, #f1e4c6 75%)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted">a home for poems &amp; books</p>
          <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight sm:text-7xl">{SITE_NAME}</h1>
          <p className="mt-5 max-w-xl font-serif text-xl italic text-muted">{SITE_TAGLINE}</p>
          <Link href="/write" className="mt-10 rounded-full bg-ink px-7 py-3 text-base font-medium text-paper shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            Write a poem
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <MyPoems />
        <h2 className="mb-6 font-display text-3xl font-semibold">Latest poems</h2>
        <Suspense fallback={<p className="text-muted">Gathering poems…</p>}>
          <Latest />
        </Suspense>
      </div>
    </main>
  );
}
