"use client";

import Link from "next/link";
import { SubmitEvent, useEffect, useMemo, useState } from "react";
import { CategoryForm } from "@/components/household-books/CategoryForm";
import { CategoryList } from "@/components/household-books/CategoryList";
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
import { getCategoryOverviews } from "@/utils/categoryCalculations";

type HouseholdBookCategoriesClientProps = {
  bookId: string;
};

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

  const categoryOverviews = useMemo(() => {
    return getCategoryOverviews(categories, transactions);
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

  async function handleCategorySubmit(event: SubmitEvent<HTMLFormElement>) {
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

  const canManageCategories = book.ownerId === user?.uid;

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

      {canManageCategories && (
        <CategoryForm
          categoryName={categoryName}
          maxBudgetInput={maxBudgetInput}
          endDateInput={endDateInput}
          editingCategoryId={editingCategoryId}
          formMessage={formMessage}
          isSubmitting={isSubmitting}
          onCategoryNameChange={setCategoryName}
          onMaxBudgetChange={setMaxBudgetInput}
          onEndDateChange={setEndDateInput}
          onSubmitAction={handleCategorySubmit}
          onCancelAction={resetForm}
        />
      )}

      <CategoryList
        categoryOverviews={categoryOverviews}
        categories={categories}
        canManageCategories={canManageCategories}
        isSubmitting={isSubmitting}
        onEditAction={startEditingCategory}
        onDeleteAction={(categoryId) => void handleDeleteCategory(categoryId)}
      />
    </main>
  );
}
