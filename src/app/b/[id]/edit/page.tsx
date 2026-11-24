import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import BookForm from "@/components/BookForm";
import DeleteBookButton from "@/components/DeleteBookButton";
import SiteHeader from "@/components/SiteHeader";
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
      <div className="mt-12 border-t border-black/10 pt-6">
        <DeleteBookButton bookId={book.id} />
      </div>
    </>
  );
}

export default function EditBookPage(props: PageProps<"/b/[id]/edit">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <h1 className="mb-8 font-display text-4xl font-semibold">Edit book</h1>
        <Suspense>
          <Body params={props.params} />
        </Suspense>
      </main>
    </>
  );
}
