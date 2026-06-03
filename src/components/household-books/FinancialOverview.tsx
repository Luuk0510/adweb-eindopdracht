"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getTransactionsByHouseholdBookId } from "@/services/householdBookService";
import { Transaction } from "@/types/transaction";

type FinancialOverviewProps = {
  bookId: string;
  title: string;
  description: string;
};

type SummaryCard = {
  label: string;
  value: string;
  accentClassName: string;
  helper: string;
};

type MonthlyChartPoint = {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
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
}: FinancialOverviewProps) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const loadTransactions = useCallback(async () => {
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
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user]);

  useEffect(() => {
    const refreshHandle = window.setTimeout(() => {
      void loadTransactions();
    }, 0);

    return () => window.clearTimeout(refreshHandle);
  }, [loadTransactions]);

  const availableMonths = useMemo(() => {
    const monthKeys = Array.from(
      new Set(transactions.map((transaction) => getMonthKey(transaction.date))),
    );

    return monthKeys.sort((firstMonth, secondMonth) => {
      return secondMonth.localeCompare(firstMonth);
    });
  }, [transactions]);

  const monthlyChartData = useMemo<MonthlyChartPoint[]>(() => {
    const totalsByMonth = new Map<
      string,
      { income: number; expense: number }
    >();

    transactions.forEach((transaction) => {
      const monthKey = getMonthKey(transaction.date);
      const currentTotals = totalsByMonth.get(monthKey) ?? {
        income: 0,
        expense: 0,
      };

      if (transaction.type === "income") {
        currentTotals.income += transaction.amount;
      } else {
        currentTotals.expense += transaction.amount;
      }

      totalsByMonth.set(monthKey, currentTotals);
    });

    return Array.from(totalsByMonth.entries())
      .sort(([firstMonth], [secondMonth]) => firstMonth.localeCompare(secondMonth))
      .map(([monthKey, totals]) => ({
        monthKey,
        monthLabel: getMonthLabel(monthKey),
        income: totals.income,
        expense: totals.expense,
        balance: totals.income - totals.expense,
      }));
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

      <article className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Maandelijkse balansgrafiek
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Bekijk inkomsten en uitgaven per maand als lijngrafiek.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            {monthlyChartData.length > 0
              ? `${monthlyChartData.length} maand${monthlyChartData.length === 1 ? "" : "en"}`
              : "Nog geen maandelijkse data"}
          </div>
        </div>

        {monthlyChartData.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-medium text-slate-900">
              De grafiek verschijnt zodra er transacties zijn.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Voeg inkomsten of uitgaven toe om de maandelijkse trend te zien.
            </p>
          </div>
        ) : (
          <div className="mt-6 h-80 rounded-2xl border border-slate-200 bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis
                  dataKey="monthLabel"
                  tickLine={false}
                  axisLine={false}
                  stroke="#64748b"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="#64748b"
                  tickFormatter={(value) => currencyFormatter.format(Number(value))}
                />
                <Tooltip
                  formatter={(value: number, name) => [
                    currencyFormatter.format(value),
                    name === "income" ? "Inkomsten" : "Uitgaven",
                  ]}
                  labelFormatter={(label) => `Maand: ${label}`}
                  contentStyle={{
                    borderRadius: 16,
                    borderColor: "#cbd5e1",
                    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Inkomsten"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Uitgaven"
                  stroke="#e11d48"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      {warningMessage ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warningMessage}
        </div>
      ) : null}

      <div className="mt-6">
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
      </div>
    </section>
  );
}
