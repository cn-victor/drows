import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import SiteHeader from "@/components/SiteHeader";
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
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-14">
        <h1 className="mb-8 text-center font-display text-4xl font-semibold">Welcome back</h1>
        <Suspense>
          <Body searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
