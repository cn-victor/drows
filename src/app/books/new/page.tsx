import { redirect } from "next/navigation";
import { Suspense } from "react";
import BookForm from "@/components/BookForm";
import AppShell from "@/components/shell/AppShell";
import { currentUser } from "@/server/auth";

export const metadata = { title: "New book" };

async function Body() {
  if (!(await currentUser())) redirect("/login?next=/books/new");
  return <BookForm />;
}

export default function NewBookPage() {
  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-8">
        <h1 className="text-3xl font-extrabold">Start a book</h1>
        <p className="mb-8 mt-2 text-muted">A book is a collection of poems or chapters. After creating it you can add chapters one by one.</p>
        <Suspense>
          <Body />
        </Suspense>
      </div>
    </AppShell>
  );
}
