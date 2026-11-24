import Link from "next/link";
import PoemActions from "./PoemActions";
import PoemCanvas from "./PoemCanvas";
import { excerpt, type Poem } from "@/lib/poem";

/** A preview of a poem in a feed or on a profile. */
export default function PoemCard({ poem: p, viewerId }: { poem: Poem; viewerId: string | null }) {
  return (
    <article className="flex flex-col gap-2">
      {p.repostedBy && (
        <p className="px-1 text-xs text-muted">
          ↻ <Link href={`/u/${p.repostedBy.username}`} className="font-medium hover:underline">{p.repostedBy.name}</Link> reposted
        </p>
      )}
      <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
        <PoemCanvas style={{ ...p.style, ambient: "none" }} className="h-72">
          <div className="flex h-72 flex-col p-6" style={{ textAlign: p.style.align }}>
            <Link href={`/p/${p.id}`} className="flex min-h-0 flex-1 flex-col">
            {p.bookTitle && (
              <p className="mb-1 text-[11px] uppercase tracking-widest" style={{ color: "var(--poem-muted)" }}>
                {p.bookTitle} · Chapter {p.chapter}
              </p>
            )}
            <h3 className="text-2xl font-semibold leading-tight" style={{ fontFamily: "var(--poem-font)" }}>{p.title}</h3>
            <p className="mt-1 text-sm italic" style={{ color: "var(--poem-muted)", fontFamily: "var(--poem-font)" }}>by {p.author}</p>
            <div className="mt-4 flex-1 space-y-0.5 overflow-hidden text-[17px] leading-snug opacity-90" style={{ fontFamily: "var(--poem-font)" }}>
              {excerpt(p.doc, 4).map((line, i) => (
                <p key={i} className="overflow-hidden text-ellipsis whitespace-pre">{line}</p>
              ))}
            </div>
            </Link>
            <div className="-mx-2 -mb-2">
              <PoemActions
                poemId={p.id}
                likes={p.likes}
                reposts={p.reposts}
                comments={p.comments}
                liked={p.liked}
                reposted={p.reposted}
                isOwner={!!viewerId && viewerId === p.authorId}
                loggedIn={!!viewerId}
                compact
              />
            </div>
          </div>
        </PoemCanvas>
      </div>
    </article>
  );
}

export function PoemGrid({ poems, viewerId, empty }: { poems: Poem[]; viewerId: string | null; empty: React.ReactNode }) {
  if (!poems.length) return <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-muted">{empty}</div>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {poems.map((p) => (
        <PoemCard key={`${p.id}-${p.repostedBy?.username ?? ""}`} poem={p} viewerId={viewerId} />
      ))}
    </div>
  );
}
