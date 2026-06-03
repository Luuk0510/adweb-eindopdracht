"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { HouseholdBookSkeleton } from "@/components/household-books/HouseholdBookSkeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  createCategory,
  deleteCategory,
  getCategoriesByHouseholdBookId,
  getCachedHouseholdBook,
  getCachedTransactions,
  getHouseholdBookById,
  getTransactionsByHouseholdBookId,
  updateCategory,
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
  endDate: Date | null;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: "safe" | "warning" | "danger";
};

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
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
  const [formMessage, setFormMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [maxBudgetInput, setMaxBudgetInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        endDate: category.endDate,
        spent,
        remaining,
        usagePercent,
        status: getStatus(spent, category.maxBudget),
      };
    });
  }, [categories, transactions]);

  function resetForm() {
    setCategoryName("");
    setMaxBudgetInput("");
    setEndDateInput("");
    setEditingCategoryId(null);
    setFormMessage("");
  }

  async function refreshCategories(userId: string) {
    const refreshedCategories = await getCategoriesByHouseholdBookId(bookId, userId);
    setCategories(refreshedCategories);
  }

  function startEditingCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setMaxBudgetInput(String(category.maxBudget));
    setEndDateInput(
      category.endDate ? category.endDate.toISOString().split("T")[0] : "",
    );
    setFormMessage("");
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    if (!user) {
      return;
    }

    const budgetNumber = Number(maxBudgetInput);
    const parsedEndDate = endDateInput ? new Date(`${endDateInput}T00:00:00`) : null;

    if (!Number.isFinite(budgetNumber)) {
      setFormMessage("Vul een geldig budget in.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategoryId) {
        await updateCategory(
          editingCategoryId,
          bookId,
          user.uid,
          categoryName,
          budgetNumber,
          parsedEndDate,
        );
      } else {
        await createCategory(
          bookId,
          user.uid,
          categoryName,
          budgetNumber,
          parsedEndDate,
        );
      }

      await refreshCategories(user.uid);
      resetForm();
      setFormMessage(
        editingCategoryId ? "Categorie bijgewerkt." : "Categorie toegevoegd.",
      );
    } catch (error) {
      if (error instanceof Error) {
        setFormMessage(error.message);
      } else {
        setFormMessage("Er is iets misgegaan met het opslaan van de categorie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!user) {
      return;
    }

    setFormMessage("");
    setIsSubmitting(true);

    try {
      await deleteCategory(categoryId, bookId, user.uid);
      await refreshCategories(user.uid);
      if (editingCategoryId === categoryId) {
        resetForm();
      }
      setFormMessage("Categorie verwijderd.");
    } catch (error) {
      if (error instanceof Error) {
        setFormMessage(error.message);
      } else {
        setFormMessage("Er is iets misgegaan met verwijderen.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingCategoryId ? "Categorie aanpassen" : "Categorie toevoegen"}
        </h2>

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCategorySubmit}>
          <label className="block text-sm text-gray-700">
            Naam
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm text-gray-700">
            Maximaal budget
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={maxBudgetInput}
              onChange={(event) => setMaxBudgetInput(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm text-gray-700 md:col-span-2">
            Einddatum (optioneel)
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 md:max-w-xs"
              value={endDateInput}
              onChange={(event) => setEndDateInput(event.target.value)}
            />
          </label>

          {formMessage ? (
            <p className="md:col-span-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {formMessage}
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {editingCategoryId ? "Opslaan" : "Toevoegen"}
            </button>

            {editingCategoryId ? (
              <button
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Annuleren
              </button>
            ) : null}
          </div>
        </form>
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
                  <p>
                    Einddatum: <strong>{category.endDate ? dateFormatter.format(category.endDate) : "Geen"}</strong>
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

                <div className="mt-5 flex gap-3">
                  <button
                    className="rounded-lg border border-gray-400 px-3 py-2 text-xs font-medium"
                    type="button"
                    onClick={() => {
                      const sourceCategory = categories.find(
                        (item) => item.id === category.id,
                      );

                      if (sourceCategory) {
                        startEditingCategory(sourceCategory);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Aanpassen
                  </button>

                  <button
                    className="rounded-lg border border-rose-400 px-3 py-2 text-xs font-medium text-rose-700"
                    type="button"
                    onClick={() => void handleDeleteCategory(category.id)}
                    disabled={isSubmitting}
                  >
                    Verwijderen
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
