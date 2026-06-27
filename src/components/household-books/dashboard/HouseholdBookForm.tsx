"use client";

import { SubmitEvent, useId } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

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
  const nameId = useId();
  const descriptionId = useId();

  return (
    <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
      <h2 className="text-xl font-semibold">
        {editingBookId ? "Huishoudboekje aanpassen" : "Nieuw huishoudboekje"}
      </h2>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor={nameId}>
            Naam *
          </label>
          <input
            id={nameId}
            className="mt-1 w-full rounded-lg border p-2"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium"
            htmlFor={descriptionId}
          >
            Omschrijving
          </label>
          <textarea
            id={descriptionId}
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
            <SecondaryButton
              className="px-4"
              type="button"
              onClick={onCancel}
            >
              Annuleren
            </SecondaryButton>
          )}
        </div>
      </form>
    </section>
  );
}
