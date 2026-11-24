import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import SiteHeader from "@/components/SiteHeader";
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
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-14">
        <h1 className="text-center font-display text-4xl font-semibold">Join {SITE_NAME}</h1>
        <p className="mb-8 mt-2 text-center text-muted">Write, share, and find readers for your poems and books.</p>
        <Suspense>
          <Body searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
