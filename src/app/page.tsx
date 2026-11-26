import Link from "next/link";
import { Suspense } from "react";
import PersonRow from "@/components/PersonRow";
import { PoemList, PoemPreview } from "@/components/PoemCard";
import AppShell, { MobileTopBar } from "@/components/shell/AppShell";
import { Tabs } from "@/components/shell/ColumnHeader";
import ScrollHide from "@/components/shell/ScrollHide";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { followingFeed, latestPoems, writersWithLatest } from "@/server/poems";

type Tab = "community" | "following" | "writers";
const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "community", label: "Community", href: "/" },
  { id: "following", label: "Following", href: "/?tab=following" },
  { id: "writers", label: "Writers", href: "/?tab=writers" },
];

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

/** Like X: on phones your picture, the mark and the bell, with the tabs underneath; on computers just
 *  the tabs. It sticks to the top, and on phones it slides away while you scroll down. */
function HomeHeader({ active }: { active: Tab }) {
  return (
    <ScrollHide className="border-b border-line bg-bg/85 backdrop-blur-md">
      <MobileTopBar />
      <Tabs active={active} tabs={TABS} />
    </ScrollHide>
  );
}

async function Writers({ viewer }: { viewer: { id: string; username: string } | null }) {
  const writers = await writersWithLatest(viewer?.id ?? null);
  if (!writers.length) return <p className="px-8 py-12 text-center text-muted">No writers yet. Yours could be the first poem.</p>;
  return writers.map((w) => (
    <section key={w.id} className="border-b border-line pb-3">
      <PersonRow
        person={{ username: w.username, name: w.name, bio: w.bio }}
        showFollow={w.username !== viewer?.username}
        following={w.following}
        loggedIn={!!viewer}
      />
      {w.latest && (
        <Link href={`/p/${w.latest.id}`} className="-mt-1 block px-4 pl-[68px]" aria-label={`Read ${w.latest.title}`}>
          <PoemPreview poem={w.latest} lines={3} />
        </Link>
      )}
    </section>
  ));
}

async function Feed({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  const tab: Tab = sp.tab === "following" || sp.tab === "writers" ? sp.tab : "community";
  return (
    <>
      <HomeHeader active={tab} />
      <div>
        {!me && tab === "community" && <Welcome />}
        {tab === "writers" ? (
          <Writers viewer={me ? { id: me.id, username: me.username } : null} />
        ) : tab === "following" && !me ? (
          <div className="px-8 py-12 text-center text-muted">
            <p className="text-2xl font-extrabold text-fg">Poems from people you follow</p>
            <p className="mt-2"><Link href="/login?next=/%3Ftab%3Dfollowing" className="text-accent hover:underline">Log in</Link> to see them here.</p>
          </div>
        ) : (
          <PoemList
            poems={tab === "following" && me ? await followingFeed(me.id) : await latestPoems(me?.id)}
            viewerId={me?.id ?? null}
            empty={
              tab === "following" ? (
                <>
                  <p className="text-2xl font-extrabold text-fg">Your feed is quiet</p>
                  <p className="mt-2">
                    It shows poems from writers you follow and what they repost. Find writers in the{" "}
                    <Link href="/?tab=writers" className="text-accent hover:underline">Writers</Link> tab.
                  </p>
                </>
              ) : (
                "No poems yet. Yours could be the first."
              )
            }
          />
        )}
      </div>
    </>
  );
}

export default function HomePage(props: PageProps<"/">) {
  return (
    <AppShell ownTop>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Feed searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
