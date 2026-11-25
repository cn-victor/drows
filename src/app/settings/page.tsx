import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SettingsForm from "@/components/SettingsForm";
import AppShell from "@/components/shell/AppShell";
import { logout } from "@/app/actions";
import { currentUser } from "@/server/auth";

export const metadata = { title: "Settings" };

async function Body() {
  const me = await currentUser();
  if (!me) redirect("/login?next=/settings");
  return (
    <>
      <p className="mb-8 text-muted">
        Signed in as <Link href={`/u/${me.username}`} className="font-medium text-ink underline">@{me.username}</Link> · {me.email}
      </p>
      <SettingsForm name={me.name} bio={me.bio} />
      <form action={logout} className="mt-12 border-t border-line pt-6">
        <button className="rounded-full px-5 py-2 text-sm ring-1 ring-line hover:bg-hover">Log out</button>
      </form>
    </>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-8">
        <h1 className="mb-2 text-3xl font-extrabold">Settings</h1>
        <Suspense>
          <Body />
        </Suspense>
      </div>
    </AppShell>
  );
}
