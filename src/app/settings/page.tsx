import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SettingsForm from "@/components/SettingsForm";
import SiteHeader from "@/components/SiteHeader";
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
      <form action={logout} className="mt-12 border-t border-black/10 pt-6">
        <button className="rounded-full px-5 py-2 text-sm ring-1 ring-black/15 hover:bg-black/5">Log out</button>
      </form>
    </>
  );
}

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-14">
        <h1 className="mb-2 font-display text-4xl font-semibold">Settings</h1>
        <Suspense>
          <Body />
        </Suspense>
      </main>
    </>
  );
}
