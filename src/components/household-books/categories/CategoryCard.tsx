"use client";

import { SecondaryButton } from "@/components/ui/SecondaryButton";
import {
  CategoryOverview,
  formatCategoryCurrency,
  formatCategoryEndDate,
} from "@/utils/categoryCalculations";

type CategoryCardProps = {
  category: CategoryOverview;
  canManageCategories: boolean;
  isSubmitting: boolean;
  onEditAction: () => void;
  onDeleteAction: () => void;
};

export function CategoryCard({
  category,
  canManageCategories,
  isSubmitting,
  onEditAction,
  onDeleteAction,
}: CategoryCardProps) {
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
    <article className={`rounded-xl border p-5 shadow-sm ${statusClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p>
          Budget: <strong>{formatCategoryCurrency(category.budget)}</strong>
        </p>
        <p>
          Uitgegeven: <strong>{formatCategoryCurrency(category.spent)}</strong>
        </p>
        <p>
          Beschikbaar:{" "}
          <strong>{formatCategoryCurrency(category.remaining)}</strong>
        </p>
        <p>
          Einddatum: <strong>{formatCategoryEndDate(category.endDate)}</strong>
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

      {canManageCategories && (
        <div className="mt-5 flex gap-3">
          <SecondaryButton
            className="py-1 text-xs"
            type="button"
            onClick={onEditAction}
            disabled={isSubmitting}
          >
            Aanpassen
          </SecondaryButton>

          <SecondaryButton
            className="py-1 text-xs"
            variant="danger"
            type="button"
            onClick={onDeleteAction}
            disabled={isSubmitting}
          >
            Verwijderen
          </SecondaryButton>
        </div>
      )}
    </article>
  );
}
