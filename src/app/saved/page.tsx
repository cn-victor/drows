import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PoemList } from "@/components/PoemCard";
import AppShell from "@/components/shell/AppShell";
import ColumnHeader from "@/components/shell/ColumnHeader";
import { currentUser } from "@/server/auth";
import { savedBy } from "@/server/poems";

export const metadata = { title: "Saved" };

async function Saved() {
  const me = await currentUser();
  if (!me) redirect("/login?next=/saved");
  return (
    <>
      <ColumnHeader title="Saved" subtitle={`@${me.username} · only you can see this`} back />
      <PoemList
        poems={await savedBy(me.id)}
        viewerId={me.id}
        empty={
          <>
            <p className="text-2xl font-extrabold text-fg">Save poems for later</p>
            <p className="mt-2">Tap the bookmark under any poem to keep it here.</p>
          </>
        }
      />
    </>
  );
}

export default function SavedPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-8 text-center text-muted">Loading…</p>}>
        <Saved />
      </Suspense>
    </AppShell>
  );
}
