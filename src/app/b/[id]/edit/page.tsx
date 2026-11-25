import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import BookForm from "@/components/BookForm";
import DeleteBookButton from "@/components/DeleteBookButton";
import AppShell from "@/components/shell/AppShell";
import { currentUser } from "@/server/auth";
import { getBook } from "@/server/books";

export const metadata = { title: "Edit book" };

async function Body({ params }: { params: PageProps<"/b/[id]/edit">["params"] }) {
  const { id } = await params;
  const [me, book] = await Promise.all([currentUser(), getBook(id)]);
  if (!book) notFound();
  if (!me || me.id !== book.authorId) redirect(`/b/${id}`);
  return (
    <>
      <BookForm book={book} />
      <div className="mt-12 border-t border-line pt-6">
        <DeleteBookButton bookId={book.id} />
      </div>
    </>
  );
}

export default function EditBookPage(props: PageProps<"/b/[id]/edit">) {
  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-8">
        <h1 className="mb-8 text-3xl font-extrabold">Edit book</h1>
        <Suspense>
          <Body params={props.params} />
        </Suspense>
      </div>
    </AppShell>
  );
}
