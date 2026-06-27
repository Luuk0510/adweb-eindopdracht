"use client";

import { useDroppable } from "@dnd-kit/core";
import { Category } from "@/types/category";
import { formatCurrency } from "@/utils/financialCalculations";

type CategoryDropZoneProps = {
  categories: Category[];
};

export function CategoryDropZone({ categories }: CategoryDropZoneProps) {
  return (
    <article className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Categorieën</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sleep een transactie naar een categorie om deze te koppelen.
      </p>

      <div className="mt-4 space-y-3">
        <CategoryDropZoneItem label="Geen categorie" categoryId={null} />

        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            Maak eerst categorieën aan om transacties eraan te koppelen.
          </p>
        ) : (
          categories.map((category) => (
            <CategoryDropZoneItem
              key={category.id}
              label={category.name}
              categoryId={category.id}
              budget={category.maxBudget}
            />
          ))
        )}
      </div>
    </article>
  );
}

type CategoryDropZoneItemProps = {
  label: string;
  categoryId: string | null;
  budget?: number;
};

function CategoryDropZoneItem({
  label,
  categoryId,
  budget,
}: CategoryDropZoneItemProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `category:${categoryId ?? ""}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-dashed p-4 text-sm transition ${
        isOver ? "border-slate-500 bg-slate-50" : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {budget !== undefined && (
          <span className="text-xs text-slate-500">
            {formatCurrency(budget)}
          </span>
        )}
      </div>
    </div>
  );
}
