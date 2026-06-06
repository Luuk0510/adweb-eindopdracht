"use client";

import { Category } from "@/types/category";
import { CategoryOverview } from "@/utils/categoryCalculations";
import { CategoryCard } from "./CategoryCard";

type CategoryListProps = {
  categoryOverviews: CategoryOverview[];
  categories: Category[];
  canManageCategories: boolean;
  isSubmitting: boolean;
  onEditAction: (category: Category) => void;
  onDeleteAction: (categoryId: string) => void;
};

export function CategoryList({
  categoryOverviews,
  categories,
  canManageCategories,
  isSubmitting,
  onEditAction,
  onDeleteAction,
}: CategoryListProps) {
  if (categoryOverviews.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Nog geen categorieen
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Voeg eerst categorieen toe om budgetstatussen te zien.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2">
      {categoryOverviews.map((category) => {
        const sourceCategory = categories.find((item) => item.id === category.id);

        return (
          <CategoryCard
            key={category.id}
            category={category}
            canManageCategories={canManageCategories}
            isSubmitting={isSubmitting}
            onEditAction={() => {
              if (sourceCategory) {
                onEditAction(sourceCategory);
              }
            }}
            onDeleteAction={() => onDeleteAction(category.id)}
          />
        );
      })}
    </section>
  );
}
