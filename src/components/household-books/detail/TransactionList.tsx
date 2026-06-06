"use client";

import { useState } from "react";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";

type TransactionListProps = {
  transactions: Transaction[];
  categories: Category[];
  effectiveMonth: string;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  canManage?: boolean;
  onEditAction: (transaction: Transaction) => void;
  onDeleteAction: (transactionId: string) => void;
};

export function TransactionList({
  transactions,
  categories,
  formatDate,
  formatCurrency,
  canManage = true,
  onEditAction,
  onDeleteAction,
}: TransactionListProps) {
  const [transactionIdToDelete, setTransactionIdToDelete] = useState<
    string | null
  >(null);

  return (
    <div className="mt-6">
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Uitgaven en inkomsten
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Gesorteerd op datum, nieuwste eerst.
            </p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-medium text-slate-900">
              Er zijn nog geen transacties voor deze maand.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const isDeleting = transactionIdToDelete === transaction.id;
              const category = categories.find(
                (currentCategory) =>
                  currentCategory.id === transaction.categoryId,
              );

              return (
                <li
                  key={transaction.id}
                  draggable={canManage && !isDeleting}
                  className={`max-w-full rounded-xl border p-4 shadow-sm transition hover:border-slate-300 ${
                    isDeleting
                      ? "border-red-200 bg-red-50"
                      : canManage
                        ? "cursor-grab border-slate-200 bg-white active:cursor-grabbing"
                        : "border-slate-200 bg-white"
                  }`}
                  onDragStart={(event) => {
                    if (!canManage) {
                      return;
                    }

                    event.dataTransfer.setData(
                      "transactionId",
                      transaction.id,
                    );
                  }}
                >
                  {isDeleting ? (
                    <div className="min-w-0 space-y-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-red-900">
                          Weet je zeker dat je deze transactie wilt verwijderen?
                        </p>
                        <p className="mt-1 break-words text-sm text-red-700">
                          {transaction.title} wordt definitief verwijderd.
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2">
                        <SecondaryButton
                          className="py-1 text-xs bg-white"
                          type="button"
                          onClick={() => setTransactionIdToDelete(null)}
                        >
                          Annuleren
                        </SecondaryButton>
                        <SecondaryButton
                          className="py-1 text-xs hover:bg-red-200"
                          variant="danger"
                          type="button"
                          onClick={() => {
                            onDeleteAction(transaction.id);
                            setTransactionIdToDelete(null);
                          }}
                        >
                          Ja, verwijderen
                        </SecondaryButton>
                      </div>
                    </div>
                  ) : (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0">
                      <p className="max-w-full break-words text-base font-semibold text-slate-950">
                        {transaction.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {formatDate(transaction.date)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 ${
                            isIncome
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isIncome ? "Inkomst" : "Uitgave"}
                        </span>
                        {category && (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
                            {category.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 sm:items-end">
                      <p
                        className={`text-lg font-semibold ${
                          isIncome ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>

                      {canManage && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <SecondaryButton
                            className="py-1 text-xs"
                            type="button"
                            onClick={() => onEditAction(transaction)}
                          >
                            Aanpassen
                          </SecondaryButton>
                          <SecondaryButton
                            className="py-1 text-xs"
                            variant="danger"
                            type="button"
                            onClick={() =>
                              setTransactionIdToDelete(transaction.id)
                            }
                          >
                            Verwijderen
                          </SecondaryButton>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
