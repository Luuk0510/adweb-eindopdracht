"use client";

import { SubmitEvent } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";

type HouseholdBookFormProps = {
  name: string;
  description: string;
  editingBookId: string | null;
  errorMessage: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function HouseholdBookForm({
  name,
  description,
  editingBookId,
  errorMessage,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: HouseholdBookFormProps) {
  return (
    <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
      <h2 className="text-xl font-semibold">
        {editingBookId ? "Huishoudboekje aanpassen" : "Nieuw huishoudboekje"}
      </h2>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">Naam *</label>
          <input
            className="mt-1 w-full rounded-lg border p-2"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Omschrijving</label>
          <textarea
            className="mt-1 w-full rounded-lg border p-2"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={3}
          />
        </div>

        {errorMessage && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="flex gap-3">
          <PrimaryButton type="submit">
            {editingBookId ? "Wijzigingen opslaan" : "Toevoegen"}
          </PrimaryButton>

          {editingBookId && (
            <button
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              type="button"
              onClick={onCancel}
            >
              Annuleren
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
