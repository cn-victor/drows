import Link from "next/link";
import { Suspense } from "react";
import PoemReel from "@/components/reel/PoemReel";
import AppShell from "@/components/shell/AppShell";
import { currentUser } from "@/server/auth";
import { followingFeed, latestPoems } from "@/server/poems";
import { toReel } from "@/server/reel";

export const metadata = { title: "Flow" };

/** Flow: the feed, one poem per screen. Following (if you follow anyone) or Latest. */
async function Flow({ searchParams }: { searchParams: PageProps<"/flow">["searchParams"] }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  let tab: "following" | "latest" = me && sp.feed !== "latest" ? "following" : "latest";
  let poems = tab === "following" && me ? await followingFeed(me.id, 40) : [];
  if (!poems.length) {
    tab = "latest";
    poems = await latestPoems(me?.id, 40);
  }
  const reel = await toReel(poems, me?.id ?? null);
  return (
    <div className="relative">
      {me && (
        <nav className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center gap-6 pt-4 sm:inset-x-auto sm:left-0 sm:flex-col sm:gap-4 sm:pl-8 sm:pt-8">
          {(["following", "latest"] as const).map((t) => (
            <Link
              key={t}
              href={t === "following" ? "/flow" : "/flow?feed=latest"}
              className={`pointer-events-auto text-[15px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${tab === t ? "text-white underline decoration-2 underline-offset-8" : "text-white/60 hover:text-white"}`}
            >
              {t === "following" ? "Following" : "Latest"}
            </Link>
          ))}
        </nav>
      )}
      <PoemReel poems={reel} viewer={me ? { id: me.id, username: me.username, name: me.name, walletAddress: me.walletAddress } : null} syncUrl={false} topInset={!!me} />
    </div>
  );
}

export default function FlowPage(props: PageProps<"/flow">) {
  return (
    <AppShell immersive>
      <Suspense fallback={<p className="grid h-screen place-items-center text-muted">Loading…</p>}>
        <Flow searchParams={props.searchParams} />
      </Suspense>
    </AppShell>
  );
}
