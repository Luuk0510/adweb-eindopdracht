"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HouseholdBookSkeleton } from "@/components/HouseholdBookSkeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getHouseholdBookById } from "@/services/householdBookService";
import { HouseholdBook } from "@/types/householdBook";

type HouseholdBookDetailClientProps = {
  bookId: string;
};

export function HouseholdBookDetailClient({
  bookId,
}: HouseholdBookDetailClientProps) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const [book, setBook] = useState<HouseholdBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <main className="mx-auto max-w-5xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-3xl font-bold">{book.name}</h1>

        <p className="mt-4 text-sm leading-6 text-gray-600">
          {book.description || "Geen omschrijving ingevuld."}
        </p>

        <div className="mt-8">
          <Link
            className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-slate-100"
            href={`/household-books/${bookId}/transactions`}
          >
            <h2 className="text-xl font-semibold text-slate-950">
              Overzicht uitgaven en inkomsten
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bekijk alle transacties op datum, filter per maand en zie de belangrijkste statistieken direct op dezelfde pagina.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
