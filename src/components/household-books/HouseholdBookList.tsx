"use client";

import {
  SecondaryButton,
  SecondaryLink,
} from "@/components/ui/SecondaryButton";
import { HouseholdBook } from "@/types/householdBook";

type HouseholdBookListProps = {
  books: HouseholdBook[];
  isLoading: boolean;
  currentUserId: string;
  onEditAction: (
    bookId: string,
    bookName: string,
    bookDescription: string,
  ) => void;
  onArchiveAction: (bookId: string) => void;
};

export function HouseholdBookList({
  books,
  isLoading,
  currentUserId,
  onEditAction,
  onArchiveAction,
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
                <SecondaryButton
                  onClick={() =>
                    onEditAction(book.id, book.name, book.description)
                  }
                >
                  Aanpassen
                </SecondaryButton>

                <SecondaryButton
                  variant="danger"
                  onClick={() => onArchiveAction(book.id)}
                >
                  Archiveren
                </SecondaryButton>
              </>
            )}

            <SecondaryLink href={`/household-books/${book.id}`}>
              Bekijken
            </SecondaryLink>

            <SecondaryLink href={`/household-books/${book.id}/categories`}>
              Categorieen
            </SecondaryLink>

            {book.ownerId === currentUserId && (
              <SecondaryLink href={`/household-books/${book.id}/members`}>
                Deelnemers
              </SecondaryLink>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
