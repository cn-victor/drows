"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { myPoems, type MyPoem } from "@/lib/mine";

/** "Your poems" on the home page: the ones published from this browser. */
export default function MyPoems() {
  const [mine, setMine] = useState<MyPoem[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(myPoems());
  }, []);
  if (!mine.length) return null;
  return (
    <section className="mb-14">
      <h2 className="mb-4 font-display text-3xl font-semibold">Your poems</h2>
      <ul className="flex flex-wrap gap-2">
        {mine.map((p) => (
          <li key={p.id} className="flex items-center overflow-hidden rounded-full bg-white/70 ring-1 ring-black/10">
            <Link href={`/p/${p.id}`} className="px-4 py-2 font-serif text-lg hover:bg-black/5">{p.title}</Link>
            <Link href={`/write?edit=${p.id}`} className="border-l border-black/10 px-3 py-2 text-sm text-muted hover:bg-black/5">Edit</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
