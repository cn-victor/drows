import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import TimeAgo from "@/components/TimeAgo";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader from "@/components/shell/ColumnHeader";
import { currentUser } from "@/server/auth";
import { conversationsOf } from "@/server/messages";

export const metadata = { title: "Messages" };

async function List() {
  const me = await currentUser();
  if (!me) redirect("/login?next=/messages");
  const list = await conversationsOf(me.id);
  if (!list.length)
    return (
      <div className="px-8 py-12 text-center text-muted">
        <p className="text-2xl font-extrabold text-fg">Welcome to your inbox</p>
        <p className="mt-2">Write privately to other writers and readers. Open someone&apos;s profile and tap the message button to start.</p>
        <Link href="/explore?tab=writers" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 font-bold text-on-accent hover:brightness-110">Find writers</Link>
      </div>
    );
  return list.map((c) => (
    <Link key={c.id} href={`/messages/${c.other.username}`} className={`flex gap-3 border-b border-line px-4 py-3 hover:bg-hover/40 ${c.unread ? "bg-accent/5" : ""}`}>
      <Avatar name={c.other.name} username={c.other.username} size={44} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1 text-[15px] leading-5">
          <span className="truncate font-bold">{c.other.name}</span>
          <span className="truncate text-muted">@{c.other.username}</span>
          {c.last && (
            <>
              <span className="text-muted">·</span>
              <span className="shrink-0 text-muted"><TimeAgo at={c.last.at} /></span>
            </>
          )}
        </p>
        <p className={`mt-0.5 truncate text-[15px] ${c.unread ? "font-bold text-fg" : "text-muted"}`}>
          {c.last ? `${c.last.mine ? "You: " : ""}${c.last.body}` : ""}
        </p>
      </div>
      {c.unread && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
    </Link>
  ));
}

export default function MessagesPage() {
  return (
    <AppShell>
      <ColumnHeader title="Messages" back />
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <List />
      </Suspense>
    </AppShell>
  );
}
