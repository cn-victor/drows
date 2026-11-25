import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import AppShell from "@/components/shell/AppShell";
import { currentUser } from "@/server/auth";

export const metadata = { title: "Log in" };

async function Body({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  if (await currentUser()) redirect(next);
  return <AuthForm mode="login" next={next} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-8">
        <h1 className="mb-8 text-center text-3xl font-extrabold">Welcome back</h1>
        <Suspense>
          <Body searchParams={props.searchParams} />
        </Suspense>
      </div>
    </AppShell>
  );
}
