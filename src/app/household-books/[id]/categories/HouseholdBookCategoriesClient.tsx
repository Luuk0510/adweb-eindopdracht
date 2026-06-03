"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HouseholdBookSkeleton } from "@/components/HouseholdBookSkeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getCategoriesByHouseholdBookId,
  getCachedHouseholdBook,
  getCachedTransactions,
  getHouseholdBookById,
  getTransactionsByHouseholdBookId,
} from "@/services/householdBookService";
import { Category } from "@/types/category";
import { HouseholdBook } from "@/types/householdBook";
import { Transaction } from "@/types/transaction";

type HouseholdBookCategoriesClientProps = {
  bookId: string;
};

type CategoryOverview = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: "safe" | "warning" | "danger";
};

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function getUsagePercent(spent: number, budget: number) {
  if (budget <= 0) {
    return 0;
  }

  return (spent / budget) * 100;
}

function getStatus(spent: number, budget: number): CategoryOverview["status"] {
  if (budget <= 0) {
    return "warning";
  }

  if (spent > budget) {
    return "danger";
  }

  if (spent >= budget * 0.8) {
    return "warning";
  }

  return "safe";
}

export function HouseholdBookCategoriesClient({
  bookId,
}: HouseholdBookCategoriesClientProps) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const [book, setBook] = useState<HouseholdBook | null>(
    getCachedHouseholdBook(bookId),
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(
    getCachedTransactions(bookId) ?? [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [foundBook, foundCategories, foundTransactions] = await Promise.all([
          getHouseholdBookById(bookId, user.uid),
          getCategoriesByHouseholdBookId(bookId, user.uid),
          getTransactionsByHouseholdBookId(bookId, user.uid),
        ]);

        setBook(foundBook);
        setCategories(foundCategories);
        setTransactions(foundTransactions);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Er is iets misgegaan bij het laden van categorieen.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [bookId, user]);

  const categoryOverviews = useMemo<CategoryOverview[]>(() => {
    return categories.map((category) => {
      const spent = transactions
        .filter((transaction) => {
          return (
            transaction.type === "expense" &&
            transaction.categoryId === category.id
          );
        })
        .reduce((total, transaction) => total + transaction.amount, 0);

      const remaining = category.maxBudget - spent;
      const usagePercent = getUsagePercent(spent, category.maxBudget);

      return {
        id: category.id,
        name: category.name,
        budget: category.maxBudget,
        spent,
        remaining,
        usagePercent,
        status: getStatus(spent, category.maxBudget),
      };
    });
  }, [categories, transactions]);

  if (isCheckingAuth || isLoading) {
    return <HouseholdBookSkeleton />;
  }

  if (errorMessage || !book) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <Link className="text-sm underline" href="/dashboard">
          Terug naar dashboard
        </Link>

        <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
          <h1 className="text-2xl font-bold">Categorieen niet beschikbaar</h1>
          <p className="mt-2 text-sm">
            {errorMessage || "Dit huishoudboekje is niet beschikbaar."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="flex items-center justify-between gap-4">
        <Link className="text-sm underline" href={`/household-books/${bookId}`}>
          Terug naar overzicht
        </Link>

        <p className="text-sm text-gray-500">{book.name}</p>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Categorie overzicht</h1>
        <p className="mt-2 text-sm text-gray-600">
          Bekijk per categorie hoeveel budget nog beschikbaar is en waar je bijna of over je limiet zit.
        </p>
      </section>

      {categoryOverviews.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Nog geen categorieen</h2>
          <p className="mt-2 text-sm text-gray-600">
            Voeg eerst categorieen toe om budgetstatussen te zien.
          </p>
        </section>
      ) : (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {categoryOverviews.map((category) => {
            const progressWidth = Math.min(category.usagePercent, 100);
            const statusClasses =
              category.status === "danger"
                ? "border-rose-300 bg-rose-50"
                : category.status === "warning"
                  ? "border-amber-300 bg-amber-50"
                  : "border-emerald-300 bg-emerald-50";

            const progressClasses =
              category.status === "danger"
                ? "bg-rose-600"
                : category.status === "warning"
                  ? "bg-amber-500"
                  : "bg-emerald-600";

            const statusLabel =
              category.status === "danger"
                ? "Over budget"
                : category.status === "warning"
                  ? "Budget bijna op"
                  : "Binnen budget";

            return (
              <article
                key={category.id}
                className={`rounded-xl border p-5 shadow-sm ${statusClasses}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p>
                    Budget: <strong>{formatCurrency(category.budget)}</strong>
                  </p>
                  <p>
                    Uitgegeven: <strong>{formatCurrency(category.spent)}</strong>
                  </p>
                  <p>
                    Beschikbaar: <strong>{formatCurrency(category.remaining)}</strong>
                  </p>
                </div>

                <div className="mt-5">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${progressClasses}`}
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    {Math.round(category.usagePercent)}% van budget gebruikt
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
