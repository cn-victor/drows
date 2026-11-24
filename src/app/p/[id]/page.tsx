import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import Comments from "@/components/Comments";
import PoemActions from "@/components/PoemActions";
import PoemCanvas from "@/components/PoemCanvas";
import PoemPlayer from "@/components/PoemPlayer";
import ShareBar from "@/components/ShareBar";
import { excerpt, renderDoc, type Poem } from "@/lib/poem";
import { buildSegments } from "@/lib/segments";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { chaptersOf, getPoem } from "@/server/poems";
import { commentsOn } from "@/server/social";

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

/** For book chapters: "Chapter 2 of …" with links to the chapters before and after. */
async function ChapterNav({ poem, where }: { poem: Poem; where: "top" | "bottom" }) {
  if (!poem.bookId) return null;
  const chapters = await chaptersOf(poem.bookId);
  const i = chapters.findIndex((c) => c.id === poem.id);
  const prev = chapters[i - 1];
  const next = chapters[i + 1];
  if (where === "top") {
    return (
      <Link href={`/b/${poem.bookId}`} className="mb-4 inline-block text-xs uppercase tracking-widest hover:underline" style={{ color: "var(--poem-muted)" }}>
        {poem.bookTitle} · Chapter {i + 1} of {chapters.length}
      </Link>
    );
  }
  return (
    <nav className="mt-14 grid grid-cols-2 gap-3 text-sm">
      {prev ? (
        <Link href={`/p/${prev.id}`} className="rounded-2xl p-4 ring-1 ring-current/20 hover:bg-white/10">
          <span style={{ color: "var(--poem-muted)" }}>← Previous</span>
          <span className="mt-1 block font-medium">{prev.title}</span>
        </Link>
      ) : <span />}
      {next ? (
        <Link href={`/p/${next.id}`} className="rounded-2xl p-4 text-right ring-1 ring-current/20 hover:bg-white/10">
          <span style={{ color: "var(--poem-muted)" }}>Next →</span>
          <span className="mt-1 block font-medium">{next.title}</span>
        </Link>
      ) : <span />}
    </nav>
  );
}

async function PoemView({ params, searchParams }: { params: PageProps<"/p/[id]">["params"]; searchParams: PageProps<"/p/[id]">["searchParams"] }) {
  const [{ id }, sp, me] = await Promise.all([params, searchParams, currentUser()]);
  const poem = await getPoem(id, me?.id);
  if (!poem) notFound();
  const { style } = poem;
  const isOwner = !!me && me.id === poem.authorId;
  const comments = await commentsOn(poem.id);
  const justify = style.align === "center" ? "justify-center" : style.align === "right" ? "justify-end" : "justify-start";

  return (
    <PoemCanvas style={style} className="min-h-screen">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-display text-xl font-semibold opacity-80 transition hover:opacity-100" style={{ color: "var(--poem-ink)" }}>
          {SITE_NAME}
        </Link>
        {me ? (
          <Link href={`/u/${me.username}`} title="Your profile"><Avatar name={me.name} username={me.username} size={30} /></Link>
        ) : (
          <Link href={`/login?next=/p/${poem.id}`} className="text-sm opacity-80 hover:opacity-100">Log in</Link>
        )}
      </header>
      <article className="mx-auto max-w-2xl px-6 pb-16 pt-6 sm:px-8 sm:pt-12">
        <div style={{ textAlign: style.align }}>
          <ChapterNav poem={poem} where="top" />
        </div>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl" style={{ fontFamily: "var(--poem-font)", textAlign: style.align }}>
          {poem.title}
        </h1>
        <p className="mt-2 text-lg italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)", textAlign: style.align }}>
          by {poem.username ? <Link href={`/u/${poem.username}`} className="hover:underline">{poem.author}</Link> : poem.author}
        </p>
        <div className="mt-6">
          <PoemPlayer poemId={poem.id} segments={buildSegments(poem.doc)} music={style.music} align={style.align} />
        </div>
        {/* The poem was cleaned when it was saved and loaded, so only safe formatting reaches the page. */}
        <div data-poem className="poem-body mt-10" dangerouslySetInnerHTML={{ __html: renderDoc(poem.doc) }} />

        <div className={`mt-12 flex ${justify}`}>
          <PoemActions
            poemId={poem.id}
            likes={poem.likes}
            reposts={poem.reposts}
            comments={comments.length}
            liked={poem.liked}
            reposted={poem.reposted}
            isOwner={isOwner}
            loggedIn={!!me}
            commentsHref="#comments"
          />
        </div>

        <ChapterNav poem={poem} where="bottom" />

        <div className="mt-12">
          <ShareBar id={poem.id} title={poem.title} isNew={sp.new === "1"} isOwner={isOwner} />
        </div>
        <div className="mt-14">
          <Comments poemId={poem.id} comments={comments} viewerId={me?.id ?? null} isPoemOwner={isOwner} />
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
