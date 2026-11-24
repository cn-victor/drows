"use client";
import { removeBook } from "@/app/actions";

export default function DeleteBookButton({ bookId }: { bookId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this book? Its chapters are kept as separate poems on your profile.")) void removeBook(bookId);
      }}
      className="rounded-full px-5 py-2 text-sm text-red-700 ring-1 ring-red-200 hover:bg-red-50"
    >
      Delete book
    </button>
  );
}
