import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PoemCanvas from "@/components/PoemCanvas";
import ShareBar from "@/components/ShareBar";
import { excerpt, renderDoc } from "@/lib/poem";
import { SITE_NAME } from "@/lib/site";
import { getPoem } from "@/server/db";

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

async function PoemView({ params, searchParams }: { params: PageProps<"/p/[id]">["params"]; searchParams: PageProps<"/p/[id]">["searchParams"] }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const poem = await getPoem(id);
  if (!poem) notFound();
  const { style } = poem;

  return (
    <PoemCanvas style={style} className="min-h-screen">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-display text-xl font-semibold opacity-80 transition hover:opacity-100" style={{ color: "var(--poem-ink)" }}>
          {SITE_NAME}
        </Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 pb-16 pt-6 sm:px-8 sm:pt-12">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl" style={{ fontFamily: "var(--poem-font)", textAlign: style.align }}>
          {poem.title}
        </h1>
        <p className="mt-2 text-lg italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)", textAlign: style.align }}>
          by {poem.author}
        </p>
        {/* The poem was cleaned when it was saved and loaded, so only safe formatting reaches the page. */}
        <div className="poem-body mt-10" dangerouslySetInnerHTML={{ __html: renderDoc(poem.doc) }} />
        <div className="mt-16">
          <ShareBar id={poem.id} title={poem.title} isNew={sp.new === "1"} />
        </div>
      </article>
    </PoemCanvas>
  );
}

export default function PoemPage(props: PageProps<"/p/[id]">) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Opening poem…</div>}>
      <PoemView params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
