import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import AppShell from "@/components/shell/AppShell";
import { SITE_NAME } from "@/lib/site";
import { currentUser } from "@/server/auth";

export const metadata = { title: "Join" };

async function Body({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  if (await currentUser()) redirect(next);
  return <AuthForm mode="signup" next={next} />;
}

export default function SignupPage(props: PageProps<"/signup">) {
  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-8">
        <h1 className="text-center text-3xl font-extrabold">Join {SITE_NAME}</h1>
        <p className="mb-8 mt-2 text-center text-muted">Write, share, and find readers for your poems and books.</p>
        <Suspense>
          <Body searchParams={props.searchParams} />
        </Suspense>
      </div>
    </AppShell>
  );
}
