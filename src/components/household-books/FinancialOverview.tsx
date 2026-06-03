"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getTransactionsByHouseholdBookId } from "@/services/householdBookService";
import { Transaction } from "@/types/transaction";

type FinancialOverviewProps = {
  bookId: string;
  title: string;
  description: string;
  mode: "overview" | "statistics";
};

type SummaryCard = {
  label: string;
  value: string;
  accentClassName: string;
  helper: string;
};

const monthFormatter = new Intl.DateTimeFormat("nl-NL", {
  month: "long",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
}

function getPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function FinancialOverview({
  bookId,
  title,
  description,
  mode,
}: FinancialOverviewProps) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      if (!user) {
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setWarningMessage("");

      try {
        const fetchedTransactions = await getTransactionsByHouseholdBookId(
          bookId,
          user.uid,
        );

        setTransactions(fetchedTransactions);
        setSelectedMonth((currentMonth) => {
          if (currentMonth) {
            return currentMonth;
          }

          return fetchedTransactions[0]
            ? getMonthKey(fetchedTransactions[0].date)
            : getMonthKey(new Date());
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Huishoudboekje niet gevonden."
        ) {
          setErrorMessage(error.message);
        } else {
          setTransactions([]);
          setSelectedMonth(getMonthKey(new Date()));
          setWarningMessage(
            "Transacties konden niet worden geladen. Je ziet nu alvast het overzicht zonder transactiedata.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, [bookId, user]);

  const availableMonths = useMemo(() => {
    const monthKeys = Array.from(
      new Set(transactions.map((transaction) => getMonthKey(transaction.date))),
    );

    return monthKeys.sort((firstMonth, secondMonth) => {
      return secondMonth.localeCompare(firstMonth);
    });
  }, [transactions]);

  const effectiveMonth = selectedMonth || availableMonths[0] || getMonthKey(new Date());

  const monthlyTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => getMonthKey(transaction.date) === effectiveMonth)
      .sort((firstTransaction, secondTransaction) => {
        return secondTransaction.date.getTime() - firstTransaction.date.getTime();
      });
  }, [effectiveMonth, transactions]);

  const incomeTotal = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expenseTotal = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const balance = incomeTotal - expenseTotal;
  const totalVolume = incomeTotal + expenseTotal;
  const largestTransaction = monthlyTransactions.reduce<Transaction | null>(
    (largest, transaction) => {
      if (!largest || transaction.amount > largest.amount) {
        return transaction;
      }

      return largest;
    },
    null,
  );

  const averageTransaction = monthlyTransactions.length
    ? totalVolume / monthlyTransactions.length
    : 0;
  const transactionCount = monthlyTransactions.length;
  const incomeCount = monthlyTransactions.filter(
    (transaction) => transaction.type === "income",
  ).length;
  const expenseCount = monthlyTransactions.filter(
    (transaction) => transaction.type === "expense",
  ).length;
  const recentTransactions = monthlyTransactions.slice(0, 3);

  const summaryCards: SummaryCard[] = [
    {
      label: "Inkomsten",
      value: currencyFormatter.format(incomeTotal),
      accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
      helper: `${getPercentage(incomeTotal, totalVolume)}% van alle bewegingen`,
    },
    {
      label: "Uitgaven",
      value: currencyFormatter.format(expenseTotal),
      accentClassName: "border-rose-200 bg-rose-50 text-rose-900",
      helper: `${getPercentage(expenseTotal, totalVolume)}% van alle bewegingen`,
    },
    {
      label: "Saldo",
      value: currencyFormatter.format(balance),
      accentClassName:
        balance >= 0
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : "border-amber-200 bg-amber-50 text-amber-900",
      helper:
        balance >= 0 ? "Je houdt deze maand geld over" : "Je geeft meer uit dan er binnenkomt",
    },
    {
      label: "Gemiddelde",
      value: currencyFormatter.format(averageTransaction),
      accentClassName: "border-slate-200 bg-slate-50 text-slate-900",
      helper: `${monthlyTransactions.length} transacties geselecteerd`,
    },
  ];

  if (isCheckingAuth || isLoading) {
    return (
      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Overzicht laden...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Overzicht niet beschikbaar</h1>
        <p className="mt-2 text-sm">{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:min-w-72">
          <label
            className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            htmlFor="month-select"
          >
            Bekijk per maand
          </label>
          <select
            id="month-select"
            value={effectiveMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {availableMonths.length > 0 ? (
              availableMonths.map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))
            ) : (
              <option value={effectiveMonth}>{getMonthLabel(effectiveMonth)}</option>
            )}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-2xl border p-5 shadow-sm ${card.accentClassName}`}
          >
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            <p className="mt-2 text-sm opacity-80">{card.helper}</p>
          </article>
        ))}
      </div>

      {warningMessage ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warningMessage}
        </div>
      ) : null}

      {mode === "overview" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Uitgaven en inkomsten</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Gesorteerd op datum, nieuwste eerst.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                {getMonthLabel(effectiveMonth)}
              </span>
            </div>

            {monthlyTransactions.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-base font-medium text-slate-900">
                  Er zijn nog geen transacties voor deze maand.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Zodra inkomsten of uitgaven worden toegevoegd, zie je ze hier direct terug.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {monthlyTransactions.map((transaction) => {
                  const isIncome = transaction.type === "income";

                  return (
                    <li
                      key={transaction.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-950">
                            {transaction.title}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {dayFormatter.format(transaction.date)}
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

                        <p
                          className={`text-lg font-semibold ${
                            isIncome ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {currencyFormatter.format(transaction.amount)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <h2 className="text-xl font-semibold">Snelle inzichten</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Meteen zichtbaar hoe deze maand zich verhoudt tussen inkomsten en uitgaven.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Inkomsten</span>
                  <span>{getPercentage(incomeTotal, totalVolume)}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-emerald-400"
                    style={{ width: `${getPercentage(incomeTotal, totalVolume)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Uitgaven</span>
                  <span>{getPercentage(expenseTotal, totalVolume)}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-rose-400"
                    style={{ width: `${getPercentage(expenseTotal, totalVolume)}%` }}
                  />
                </div>
              </div>
            </div>

            <dl className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">
                <dt className="text-slate-400">Grootste beweging</dt>
                <dd className="mt-1 text-base font-semibold text-white">
                  {largestTransaction
                    ? `${largestTransaction.title} · ${currencyFormatter.format(largestTransaction.amount)}`
                    : "Nog geen transacties"}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <dt className="text-slate-400">Maandbalans</dt>
                <dd className="mt-1 text-base font-semibold text-white">
                  {balance >= 0 ? "Positief" : "Negatief"}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <dt className="text-slate-400">Acties</dt>
                <dd className="mt-2">
                  <Link
                    className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                    href={`/household-books/${bookId}`}
                  >
                    Terug naar huishoudboekje
                  </Link>
                </dd>
              </div>
            </dl>
          </article>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Statistische samenvatting</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Focus op verhouding, aantallen en grootste bewegingen binnen de gekozen maand.
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                {getMonthLabel(effectiveMonth)}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Aantal transacties</p>
                <p className="mt-2 text-3xl font-semibold text-white">{transactionCount}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Maandstatus</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {balance >= 0 ? "Positief" : "Negatief"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Inkomsten</span>
                  <span>{incomeCount} transacties</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-emerald-400"
                    style={{ width: `${getPercentage(incomeTotal, totalVolume)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Uitgaven</span>
                  <span>{expenseCount} transacties</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-rose-400"
                    style={{ width: `${getPercentage(expenseTotal, totalVolume)}%` }}
                  />
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <dt className="text-sm text-slate-400">Grootste beweging</dt>
                <dd className="mt-2 text-base font-semibold text-white">
                  {largestTransaction
                    ? `${largestTransaction.title} · ${currencyFormatter.format(largestTransaction.amount)}`
                    : "Nog geen transacties"}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <dt className="text-sm text-slate-400">Gemiddelde transactie</dt>
                <dd className="mt-2 text-base font-semibold text-white">
                  {currencyFormatter.format(averageTransaction)}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Laatste bewegingen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              De drie meest recente transacties van de geselecteerde maand.
            </p>

            {recentTransactions.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-base font-medium text-slate-900">
                  Nog geen transacties om statistieken op te baseren.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {recentTransactions.map((transaction) => {
                  const isIncome = transaction.type === "income";

                  return (
                    <li
                      key={transaction.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-950">
                            {transaction.title}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {dayFormatter.format(transaction.date)}
                          </p>
                        </div>
                        <p
                          className={`text-base font-semibold ${
                            isIncome ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {currencyFormatter.format(transaction.amount)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Navigatie</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  href={`/household-books/${bookId}/transactions`}
                >
                  Naar transacties
                </Link>
                <Link
                  className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  href={`/household-books/${bookId}`}
                >
                  Terug naar huishoudboekje
                </Link>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
