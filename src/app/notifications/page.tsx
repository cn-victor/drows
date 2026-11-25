import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import { CommentIcon, GiftIcon, HeartIcon, RepostIcon, UserIcon } from "@/components/icons";
import TimeAgo from "@/components/TimeAgo";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader from "@/components/shell/ColumnHeader";
import { currentUser } from "@/server/auth";
import { markNotificationsRead, notificationsFor, type Notification } from "@/server/notify";

export const metadata = { title: "Notifications" };

const LOOK: Record<Notification["kind"], { icon: ReactNode; text: string }> = {
  like: { icon: <HeartIcon size={26} filled className="text-pink-500" />, text: "liked your poem" },
  repost: { icon: <RepostIcon size={26} filled className="text-emerald-500" />, text: "reposted your poem" },
  comment: { icon: <CommentIcon size={26} className="text-accent" />, text: "replied to your poem" },
  follow: { icon: <UserIcon size={26} filled className="text-accent" />, text: "followed you" },
  gift: { icon: <GiftIcon size={26} className="text-amber-400" />, text: "sent you a gift for" },
};

function Row({ n }: { n: Notification }) {
  const look = LOOK[n.kind];
  const href =
    n.kind !== "follow" && n.poem ? `/p/${n.poem.id}${n.kind === "comment" ? "#comments" : ""}` : `/u/${n.actor.username}`;
  return (
    <Link href={href} className={`flex gap-3 border-b border-line px-4 py-3 hover:bg-hover/40 ${n.unread ? "bg-accent/5" : ""}`}>
      <span className="flex w-10 shrink-0 justify-end pt-1">{look.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <Avatar name={n.actor.name} username={n.actor.username} size={32} />
          <span className="text-[13px] text-muted"><TimeAgo at={n.at} /></span>
        </div>
        <p className="mt-2 text-[15px]">
          <b>{n.actor.name}</b> {look.text}
          {n.poem && n.kind !== "follow" && <> <span className="font-medium">“{n.poem.title}”</span></>}
        </p>
        {n.body && <p className="mt-1 line-clamp-3 whitespace-pre-line text-[15px] text-muted">{n.body}</p>}
      </div>
    </Link>
  );
}

async function List() {
  const me = await currentUser();
  if (!me) redirect("/login?next=/notifications");
  const list = await notificationsFor(me.id);
  await markNotificationsRead(me.id); // opening this page counts as reading them
  if (!list.length)
    return (
      <div className="px-8 py-12 text-center text-muted">
        <p className="text-2xl font-extrabold text-fg">Nothing yet</p>
        <p className="mt-2">When someone likes, replies to, reposts or gifts your poems, or follows you, you&apos;ll see it here.</p>
      </div>
    );
  return list.map((n) => <Row key={n.id} n={n} />);
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <ColumnHeader title="Notifications" back />
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <List />
      </Suspense>
    </AppShell>
  );
}
