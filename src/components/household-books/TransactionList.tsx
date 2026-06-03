import { Transaction } from "@/types/transaction";

type TransactionListProps = {
  transactions: Transaction[];
  effectiveMonth: string;
  getMonthLabel: (monthKey: string) => string;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  onEditAction: (transaction: Transaction) => void;
  onDeleteAction: (transactionId: string) => void;
};

export function TransactionList({
  transactions,
  effectiveMonth,
  getMonthLabel,
  formatDate,
  formatCurrency,
  onEditAction,
  onDeleteAction,
}: TransactionListProps) {
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
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            {getMonthLabel(effectiveMonth)}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-medium text-slate-900">
              Er zijn nog geen transacties voor deze maand.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Zodra inkomsten of uitgaven worden toegevoegd, zie je ze hier
              direct terug.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";

              return (
                <li
                  key={transaction.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-950">
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
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <p
                        className={`text-lg font-semibold ${
                          isIncome ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>

                      <div className="flex gap-2">
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium"
                          type="button"
                          onClick={() => onEditAction(transaction)}
                        >
                          Aanpassen
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700"
                          type="button"
                          onClick={() => onDeleteAction(transaction.id)}
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
