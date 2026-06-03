"use client";

import { HouseholdBook } from "@/types/householdBook";

type ArchivedHouseholdBookListProps = {
  archivedBooks: HouseholdBook[];
  onRestoreAction: (bookId: string) => void;
};

export function ArchivedHouseholdBookList({
  archivedBooks,
  onRestoreAction,
}: ArchivedHouseholdBookListProps) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">Gearchiveerde huishoudboekjes</h2>

      {archivedBooks.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">
          Er zijn geen gearchiveerde huishoudboekjes.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {archivedBooks.map((book) => (
            <article
              key={book.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-900"
            >
              <h3 className="text-xl font-semibold">{book.name}</h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {book.description || "Geen omschrijving ingevuld."}
              </p>

              <button
                className="mt-4 rounded-lg border px-3 py-2 text-sm font-medium"
                onClick={() => onRestoreAction(book.id)}
              >
                Herstellen
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
