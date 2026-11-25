import Link from "next/link";
import { Suspense } from "react";
import { PoemList } from "@/components/PoemCard";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader, { Tabs } from "@/components/shell/ColumnHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { followingFeed, latestPoems } from "@/server/poems";

function Welcome() {
  return (
    <section className="border-b border-line px-6 py-10 text-center">
      <h2 className="font-display text-5xl font-semibold">{SITE_NAME}</h2>
      <p className="mx-auto mt-3 max-w-md font-serif text-lg italic text-muted">{SITE_TAGLINE}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/signup" className="rounded-full bg-accent px-6 py-2.5 font-bold text-on-accent hover:brightness-110">Start writing</Link>
        <Link href="/login" className="rounded-full px-6 py-2.5 font-bold ring-1 ring-line hover:bg-hover">Log in</Link>
      </div>
    </section>
  );
}

async function Feed({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  const tab = me && sp.feed !== "latest" ? "following" : "latest";
  const poems = tab === "following" && me ? await followingFeed(me.id) : await latestPoems(me?.id);
  return (
    <>
      <ColumnHeader title="Home" desktopOnlyTitle>
        {me && (
          <Tabs
            active={tab}
            tabs={[
              { id: "following", label: "Following", href: "/" },
              { id: "latest", label: "Latest", href: "/?feed=latest" },
            ]}
          />
        )}
      </ColumnHeader>
      {!me && <Welcome />}
      <PoemList
        poems={poems}
        viewerId={me?.id ?? null}
        empty={
          tab === "following" ? (
            <>
              <p className="text-2xl font-extrabold text-fg">Your feed is quiet</p>
              <p className="mt-2">It shows poems from writers you follow and what they repost. Find writers in <Link href="/explore" className="text-accent hover:underline">Explore</Link>.</p>
            </>
          ) : (
            "No poems yet. Yours could be the first."
          )
        }
      />
    </>
  );
}

export default function HomePage(props: PageProps<"/">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Feed searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
