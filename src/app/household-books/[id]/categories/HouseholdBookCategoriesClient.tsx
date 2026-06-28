"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CategoryForm } from "@/components/household-books/categories/CategoryForm";
import { CategoryList } from "@/components/household-books/categories/CategoryList";
import { HouseholdBookSkeleton } from "@/components/household-books/feedback/HouseholdBookSkeleton";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useCategoryForm } from "@/hooks/useCategoryForm";
import { useHouseholdBookPage } from "@/hooks/useHouseholdBookPage";
import { getCategoriesByHouseholdBookId } from "@/services/categoryService";
import { getTransactionsByHouseholdBookId } from "@/services/transactionService";
import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";
import { getCategoryOverviews } from "@/utils/categoryCalculations";

type HouseholdBookCategoriesClientProps = {
  bookId: string;
  cameFromDashboard: boolean;
};

export function HouseholdBookCategoriesClient({
  bookId,
  cameFromDashboard,
}: HouseholdBookCategoriesClientProps) {
  const { user, book, isCheckingAuth, isLoadingBook } =
    useHouseholdBookPage(bookId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const backHref = cameFromDashboard
    ? "/dashboard"
    : `/household-books/${bookId}`;
  const backLabel = cameFromDashboard
    ? "Terug naar dashboard"
    : "Terug naar overzicht";

  async function refreshCategories() {
    if (!user) {
      return;
    }

    const refreshedCategories = await getCategoriesByHouseholdBookId(
      bookId,
      user.uid,
    );
    setCategories(refreshedCategories);
  }

  const {
    categoryName,
    maxBudgetInput,
    endDateInput,
    editingCategoryId,
    formMessage,
    isSubmitting,
    setCategoryName,
    setMaxBudgetInput,
    setEndDateInput,
    resetCategoryForm,
    startEditingCategory,
    handleCategorySubmit,
    handleDeleteCategory,
  } = useCategoryForm({
    bookId,
    user,
    refreshCategories,
    onSaved: () => setIsFormOpen(false),
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) {
        return;
      }

      setIsLoadingData(true);
      setErrorMessage("");

      try {
        const [foundCategories, foundTransactions] = await Promise.all([
          getCategoriesByHouseholdBookId(bookId, user.uid),
          getTransactionsByHouseholdBookId(bookId, user.uid),
        ]);

        if (isMounted) {
          setCategories(foundCategories);
          setTransactions(foundTransactions);
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage(
              "Er is iets misgegaan bij het laden van categorieen.",
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [bookId, user]);

  const categoryOverviews = useMemo(() => {
    return getCategoryOverviews(categories, transactions);
  }, [categories, transactions]);

  if (isCheckingAuth || isLoadingBook || isLoadingData) {
    return <HouseholdBookSkeleton />;
  }

  if (errorMessage || !book) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <Link className="text-sm underline" href={backHref}>
          {backLabel}
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

  function startCreatingCategory() {
    resetCategoryForm();
    setIsFormOpen(true);
  }

  function handleEditCategory(category: Category) {
    startEditingCategory(category);
    setIsFormOpen(true);
  }

  function closeCategoryForm() {
    resetCategoryForm();
    setIsFormOpen(false);
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="flex items-center justify-between gap-4">
        <Link className="text-sm underline" href={backHref}>
          {backLabel}
        </Link>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Categorie overzicht van {book.name}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Bekijk per categorie hoeveel budget nog beschikbaar is en waar je
          bijna of over je limiet zit.
        </p>
      </section>

      {canManageCategories && (
        <div className="mt-6">
          <PrimaryButton onClick={startCreatingCategory}>
            Categorie toevoegen
          </PrimaryButton>
        </div>
      )}

      {canManageCategories && isFormOpen && (
        <Modal onClose={closeCategoryForm}>
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
            onCancelAction={closeCategoryForm}
          />
        </Modal>
      )}

      <CategoryList
        categoryOverviews={categoryOverviews}
        categories={categories}
        canManageCategories={canManageCategories}
        isSubmitting={isSubmitting}
        onEditAction={handleEditCategory}
        onDeleteAction={(categoryId) => void handleDeleteCategory(categoryId)}
      />
    </main>
  );
}
