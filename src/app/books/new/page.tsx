import { redirect } from "next/navigation";
import { Suspense } from "react";
import BookForm from "@/components/BookForm";
import SiteHeader from "@/components/SiteHeader";
import { currentUser } from "@/server/auth";

export const metadata = { title: "New book" };

async function Body() {
  if (!(await currentUser())) redirect("/login?next=/books/new");
  return <BookForm />;
}

export default function NewBookPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <h1 className="font-display text-4xl font-semibold">Start a book</h1>
        <p className="mb-8 mt-2 text-muted">A book is a collection of poems or chapters. After creating it you can add chapters one by one.</p>
        <Suspense>
          <Body />
        </Suspense>
      </main>
    </>
  );
}
