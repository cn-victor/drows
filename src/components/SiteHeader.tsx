import Link from "next/link";
import { Suspense } from "react";
import Avatar from "./Avatar";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/server/auth";

async function HeaderUser() {
  const me = await currentUser();
  if (!me) {
    return (
      <>
        <Link href="/login" className="rounded-full px-3 py-1.5 text-sm hover:bg-black/5">Log in</Link>
        <Link href="/signup" className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper hover:opacity-90">Join</Link>
      </>
    );
  }
  return (
    <>
      <Link href="/wallet" className="rounded-full px-3 py-1.5 text-sm hover:bg-black/5" title="Your wallet and gifts">Wallet</Link>
      <Link href="/write" className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper hover:opacity-90">Write</Link>
      <Link href={`/u/${me.username}`} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm hover:bg-black/5" title="Your profile">
        <Avatar name={me.name} username={me.username} size={30} />
        <span className="hidden sm:inline">{me.name}</span>
      </Link>
    </>
  );
}

/** The bar at the top of most pages. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="mr-auto font-display text-2xl font-semibold tracking-tight">{SITE_NAME}</Link>
        <Suspense fallback={<span className="h-8 w-24" />}>
          <HeaderUser />
        </Suspense>
      </div>
    </header>
  );
}
