"use client";

import { useState } from "react";
import { User } from "firebase/auth";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/services/categoryService";
import { Category } from "@/types/category";

type UseCategoryFormOptions = {
  bookId: string;
  user: User | null;
  refreshCategories: () => Promise<void>;
};

export function useCategoryForm({
  bookId,
  user,
  refreshCategories,
}: UseCategoryFormOptions) {
  const [formMessage, setFormMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [maxBudgetInput, setMaxBudgetInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetCategoryForm() {
    setCategoryName("");
    setMaxBudgetInput("");
    setEndDateInput("");
    setEditingCategoryId(null);
    setFormMessage("");
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

  async function handleCategorySubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormMessage("");

    if (!user) {
      return;
    }

    const budgetNumber = Number(maxBudgetInput);
    const parsedEndDate = endDateInput
      ? new Date(`${endDateInput}T00:00:00`)
      : null;

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

      await refreshCategories();
      const message = editingCategoryId
        ? "Categorie bijgewerkt."
        : "Categorie toegevoegd.";
      resetCategoryForm();
      setFormMessage(message);
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan met het opslaan van de categorie.",
      );
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
      await refreshCategories();

      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }

      setFormMessage("Categorie verwijderd.");
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan met verwijderen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
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
  };
}
