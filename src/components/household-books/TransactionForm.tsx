"use client";

import { SubmitEvent } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

type TransactionFormProps = {
  title: string;
  amount: string;
  type: "expense" | "income";
  date: string;
  editingTransactionId: string | null;
  errorMessage: string;
  onTitleChange: (title: string) => void;
  onAmountChange: (amount: string) => void;
  onTypeChange: (type: "expense" | "income") => void;
  onDateChange: (date: string) => void;
  onSubmitAction: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancelAction: () => void;
};

export function TransactionForm({
  title,
  amount,
  type,
  date,
  editingTransactionId,
  errorMessage,
  onTitleChange,
  onAmountChange,
  onTypeChange,
  onDateChange,
  onSubmitAction,
  onCancelAction,
}: TransactionFormProps) {
  return (
    <article className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        {editingTransactionId
          ? "Transactie aanpassen"
          : "Nieuwe transactie"}
      </h2>

      <form onSubmit={onSubmitAction} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Titel
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Bijvoorbeeld boodschappen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Kosten *
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Soort
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            value={type}
            onChange={(event) =>
              onTypeChange(event.target.value as "expense" | "income")
            }
          >
            <option value="expense">Uitgave</option>
            <option value="income">Inkomst</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Datum
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>

        {errorMessage && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="submit">
            {editingTransactionId ? "Wijzigingen opslaan" : "Toevoegen"}
          </PrimaryButton>

          {editingTransactionId && (
            <SecondaryButton
              className="px-4"
              type="button"
              onClick={onCancelAction}
            >
              Annuleren
            </SecondaryButton>
          )}
        </div>
      </form>
    </article>
  );
}
