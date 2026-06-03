"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HouseholdBookSkeleton } from "@/components/household-books/HouseholdBookSkeleton";
import { FinancialOverview } from "@/components/household-books/FinancialOverview";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getCachedHouseholdBook,
  getHouseholdBookById,
} from "@/services/householdBookService";
import { HouseholdBook } from "@/types/householdBook";

type HouseholdBookDetailClientProps = {
  bookId: string;
};

export function HouseholdBookDetailClient({
  bookId,
}: HouseholdBookDetailClientProps) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const cachedBook = getCachedHouseholdBook(bookId);
  const [book, setBook] = useState<HouseholdBook | null>(cachedBook);
  const [isLoading, setIsLoading] = useState(!cachedBook);

  useEffect(() => {
    async function loadBook() {
      if (!user) {
        return;
      }

      try {
        const foundBook = await getHouseholdBookById(bookId, user.uid);
        setBook(foundBook);
      } catch {
        setBook(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadBook();
  }, [bookId, user]);

  if (isCheckingAuth || isLoading) {
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
    <main className="mx-auto max-w-6xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-3xl font-bold">{book.name}</h1>

        <p className="mt-4 text-sm leading-6 text-gray-600">
          {book.description || "Geen omschrijving ingevuld."}
        </p>

        <div className="mt-4">
          <Link
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            href={`/household-books/${bookId}/categories`}
          >
            Categorie overzicht
          </Link>
        </div>
      </section>

      <FinancialOverview
        bookId={bookId}
        title="Overzicht van uitgaven en inkomsten"
        description="Bekijk je financiële bewegingen op datum, filter per maand en zie meteen welke balans je opbouwt binnen dit huishoudboekje."
      />
    </main>
  );
}
