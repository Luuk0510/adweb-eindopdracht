"use client";

import { SubmitEvent } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

type CategoryFormProps = {
  categoryName: string;
  maxBudgetInput: string;
  endDateInput: string;
  editingCategoryId: string | null;
  formMessage: string;
  isSubmitting: boolean;
  onCategoryNameChange: (name: string) => void;
  onMaxBudgetChange: (budget: string) => void;
  onEndDateChange: (date: string) => void;
  onSubmitAction: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancelAction: () => void;
};

export function CategoryForm({
  categoryName,
  maxBudgetInput,
  endDateInput,
  editingCategoryId,
  formMessage,
  isSubmitting,
  onCategoryNameChange,
  onMaxBudgetChange,
  onEndDateChange,
  onSubmitAction,
  onCancelAction,
}: CategoryFormProps) {
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">
        {editingCategoryId ? "Categorie aanpassen" : "Categorie toevoegen"}
      </h2>

      <form
        className="mt-4 grid gap-4 md:grid-cols-2"
        onSubmit={onSubmitAction}
      >
        <label className="block text-sm text-gray-700">
          Naam
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            value={categoryName}
            onChange={(event) => onCategoryNameChange(event.target.value)}
            maxLength={50}
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
            onChange={(event) => onMaxBudgetChange(event.target.value)}
            required
          />
        </label>

        <label className="block text-sm text-gray-700">
          Einddatum (optioneel)
          <input
            type="date"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            value={endDateInput}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </label>

        {formMessage ? (
          <p className="md:col-span-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {formMessage}
          </p>
        ) : null}

        <div className="md:col-span-2 flex flex-wrap justify-center gap-3">
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {editingCategoryId ? "Opslaan" : "Toevoegen"}
          </PrimaryButton>

          <SecondaryButton
            type="button"
            onClick={onCancelAction}
            disabled={isSubmitting}
          >
            Annuleren
          </SecondaryButton>
        </div>
      </form>
    </section>
  );
}
