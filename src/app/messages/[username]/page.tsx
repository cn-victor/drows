import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Avatar from "@/components/Avatar";
import MessageThread from "@/components/MessageThread";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader from "@/components/shell/ColumnHeader";
import { currentUser, getProfile } from "@/server/auth";
import { threadWith } from "@/server/messages";

export const metadata = { title: "Messages" };

async function Thread({ params }: { params: PageProps<"/messages/[username]">["params"] }) {
  const { username } = await params;
  const me = await currentUser();
  if (!me) redirect(`/login?next=/messages/${username}`);
  const other = await getProfile(username, me.id);
  if (!other) notFound();
  if (other.id === me.id) redirect("/messages");
  const messages = await threadWith(me.id, other.id);
  return (
    <>
      <ColumnHeader
        back
        title={
          <Link href={`/u/${other.username}`} className="flex items-center gap-2 hover:underline">
            <Avatar name={other.name} username={other.username} size={28} />
            {other.name}
          </Link>
        }
      />
      <MessageThread username={other.username} name={other.name} messages={messages} />
    </>
  );
}

export default function ThreadPage(props: PageProps<"/messages/[username]">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Thread params={props.params} />
      </Suspense>
    </AppShell>
  );
}
