"use client";

import Link from "next/link";
import { HouseholdBookSkeleton } from "@/components/household-books/feedback/HouseholdBookSkeleton";
import { FinancialOverview } from "@/components/household-books/detail/FinancialOverview";
import { useHouseholdBookPage } from "@/hooks/useHouseholdBookPage";

type HouseholdBookDetailClientProps = {
  bookId: string;
};

export function HouseholdBookDetailClient({
  bookId,
}: HouseholdBookDetailClientProps) {
  const { user, book, isCheckingAuth, isLoadingBook } =
    useHouseholdBookPage(bookId);

  if (isCheckingAuth || isLoadingBook) {
    return <HouseholdBookSkeleton />;
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <Link className="text-sm underline" href="/dashboard">
          Terug naar dashboard
        </Link>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
          <h1 className="text-2xl font-bold">Huishoudboekje niet gevonden</h1>
          <p className="mt-2 text-sm text-gray-600">
            Dit huishoudboekje bestaat niet, is gearchiveerd of is niet van jou.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <FinancialOverview
        bookId={bookId}
        title={`Overzicht van ${book.name}`}
        description={book.description || "Geen omschrijving ingevuld."}
        categoryOverviewHref={`/household-books/${bookId}/categories`}
        canManage={book.ownerId === user?.uid}
      />
    </main>
  );
}
