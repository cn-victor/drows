import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PoemReel from "@/components/reel/PoemReel";
import AppShell from "@/components/shell/AppShell";
import { excerpt } from "@/lib/poem";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { chaptersOf, getPoem, latestPoems } from "@/server/poems";
import { toReel } from "@/server/reel";

export async function generateMetadata(props: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const poem = await getPoem(id);
  if (!poem) return { title: "Poem not found" };
  const description = excerpt(poem.doc, 3).join(" / ");
  return {
    title: `${poem.title} by ${poem.author}`,
    description,
    openGraph: { title: poem.title, description: `${description}\n\nby ${poem.author}`, siteName: SITE_NAME, type: "article" },
  };
}

/** Opens the poem full-screen. Swiping up continues with the book's next chapters (for a chapter),
 *  then the newest poems. */
async function Reel({ params }: { params: PageProps<"/p/[id]">["params"] }) {
  const [{ id }, me] = await Promise.all([params, currentUser()]);
  const poem = await getPoem(id, me?.id);
  if (!poem) notFound();
  const seen = new Set([poem.id]);
  const more = [];
  if (poem.bookId) {
    const chapters = await chaptersOf(poem.bookId, me?.id);
    const at = chapters.findIndex((c) => c.id === poem.id);
    for (const c of chapters.slice(at + 1)) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      more.push(c);
    }
  }
  for (const p of await latestPoems(me?.id, 30)) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    more.push(p);
  }
  const poems = await toReel([poem, ...more], me?.id ?? null);
  return <PoemReel poems={poems} viewer={me ? { id: me.id, username: me.username, name: me.name, walletAddress: me.walletAddress } : null} />;
}

export default function PoemPage(props: PageProps<"/p/[id]">) {
  return (
    <AppShell immersive>
      <Suspense fallback={<p className="grid h-screen place-items-center text-muted">Opening poem…</p>}>
        <Reel params={props.params} />
      </Suspense>
    </AppShell>
  );
}
