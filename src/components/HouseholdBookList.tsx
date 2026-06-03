"use client";

import Link from "next/link";
import { HouseholdBook } from "@/types/householdBook";

type HouseholdBookListProps = {
  books: HouseholdBook[];
  isLoading: boolean;
<<<<<<< HEAD
  currentUserId: string;
  onEditAction: (
    bookId: string,
    bookName: string,
    bookDescription: string,
  ) => void;
  onArchiveAction: (bookId: string) => void;
=======
  onEdit: (bookId: string, bookName: string, bookDescription: string) => void;
  onArchive: (bookId: string) => void;
>>>>>>> ac4b893 (remove code)
};

export function HouseholdBookList({
  books,
  isLoading,
<<<<<<< HEAD
  currentUserId,
  onEditAction,
  onArchiveAction,
=======
  onEdit,
  onArchive,
>>>>>>> ac4b893 (remove code)
}: HouseholdBookListProps) {
  if (isLoading) {
    return (
      <section className="rounded-xl border p-6">
        <p>Huishoudboekjes laden...</p>
      </section>
    );
  }

  if (books.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-900">
        <h2 className="text-xl font-semibold">Nog geen huishoudboekjes</h2>
        <p className="mt-2 text-gray-600">
          Maak je eerste huishoudboekje aan met het formulier hierboven.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {books.map((book) => (
        <article
          key={book.id}
          className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">{book.name}</h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {book.description || "Geen omschrijving ingevuld."}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {book.ownerId === currentUserId && (
              <>
                <button
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  onClick={() =>
                    onEditAction(book.id, book.name, book.description)
                  }
                >
                  Aanpassen
                </button>

                <button
                  className="rounded-lg border px-3 py-2 text-sm font-medium text-red-700"
                  onClick={() => onArchiveAction(book.id)}
                >
                  Archiveren
                </button>
              </>
            )}

            <Link
              className="rounded-lg border px-3 py-2 text-sm font-medium"
              href={`/household-books/${book.id}`}
            >
              Bekijken
            </Link>

            {book.ownerId === currentUserId && (
              <Link
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                href={`/household-books/${book.id}/members`}
              >
                Deelnemers
              </Link>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
