"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  createTransaction,
  deleteTransaction,
  getCachedTransactions,
  getTransactionsByHouseholdBookId,
  updateTransaction,
} from "@/services/householdBookService";

import { FinancialHeader } from "@/components/household-books/FinancialHeader";
import {
  FinancialSummaryCards,
  SummaryCardData,
} from "@/components/household-books/FinancialSummaryCards";
import {
  MonthlyBalanceChart,
  MonthlyChartPoint,
} from "@/components/household-books/MonthlyBalanceChart";
import { TransactionForm } from "@/components/household-books/TransactionForm";
import { TransactionList } from "@/components/household-books/TransactionList";

import { Transaction } from "@/types/transaction";

type FinancialOverviewProps = {
  bookId: string;
  title: string;
  description: string;
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

function formatDate(date: Date) {
  return dayFormatter.format(date);
}

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFromInput(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function FinancialOverview({
  bookId,
  title,
  description,
}: FinancialOverviewProps) {
  const { user, isCheckingAuth } = useAuthRedirect();

  const cachedTransactions = getCachedTransactions(bookId);

  const [transactions, setTransactions] = useState<Transaction[]>(
    cachedTransactions ?? [],
  );

  const [selectedMonth, setSelectedMonth] = useState<string>(
    cachedTransactions?.[0]
      ? getMonthKey(cachedTransactions[0].date)
      : "",
  );

  const [isLoading, setIsLoading] = useState(!cachedTransactions);
  const [errorMessage, setErrorMessage] = useState("");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    "expense",
  );
  const [transactionDate, setTransactionDate] = useState(
    getDateInputValue(new Date()),
  );
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [transactionErrorMessage, setTransactionErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;
    let isMounted = true;

    async function loadTransactions() {
      try {
        const fetchedTransactions =
          (await getTransactionsByHouseholdBookId(
            bookId,
            userId,
          )) ?? [];

        if (!isMounted) {
          return;
        }

        setErrorMessage("");
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
        if (!isMounted) {
          return;
        }

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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [bookId, user]);

  const availableMonths = Array.from(
    new Set(
      transactions.map((transaction) =>
        getMonthKey(transaction.date),
      ),
    ),
  ).sort((firstMonth, secondMonth) =>
    secondMonth.localeCompare(firstMonth),
  );

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
      .sort(([firstMonth], [secondMonth]) =>
        firstMonth.localeCompare(secondMonth),
      )
      .map(([monthKey, totals]) => ({
        monthKey,
        monthLabel: getMonthLabel(monthKey),
        income: totals.income,
        expense: totals.expense,
        balance: totals.income - totals.expense,
      }));
  }, [transactions]);

  const effectiveMonth =
    selectedMonth ||
    availableMonths[0] ||
    getMonthKey(new Date());

  const monthlyTransactions = transactions
    .filter(
      (transaction) =>
        getMonthKey(transaction.date) === effectiveMonth,
    )
    .sort(
      (firstTransaction, secondTransaction) =>
        secondTransaction.date.getTime() -
        firstTransaction.date.getTime(),
    );

  const incomeTotal = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

  const expenseTotal = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

  const balance = incomeTotal - expenseTotal;
  const totalVolume = incomeTotal + expenseTotal;

  const summaryCards: SummaryCardData[] = [
    {
      label: "Inkomsten",
      value: formatCurrency(incomeTotal),
      accentClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-900",
      helper: `${getPercentage(
        incomeTotal,
        totalVolume,
      )}% van alle bewegingen`,
    },
    {
      label: "Uitgaven",
      value: formatCurrency(expenseTotal),
      accentClassName:
        "border-rose-200 bg-rose-50 text-rose-900",
      helper: `${getPercentage(
        expenseTotal,
        totalVolume,
      )}% van alle bewegingen`,
    },
    {
      label: "Saldo",
      value: formatCurrency(balance),
      accentClassName:
        balance >= 0
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : "border-amber-200 bg-amber-50 text-amber-900",
      helper:
        balance >= 0
          ? "Je houdt deze maand geld over"
          : "Je geeft meer uit dan er binnenkomt",
    },
  ];

  async function refreshTransactions() {
    if (!user) {
      return;
    }

    const fetchedTransactions =
      (await getTransactionsByHouseholdBookId(bookId, user.uid)) ?? [];

    setTransactions(fetchedTransactions);
  }

  function resetTransactionForm() {
    setTransactionTitle("");
    setTransactionAmount("");
    setTransactionType("expense");
    setTransactionDate(getDateInputValue(new Date()));
    setEditingTransactionId(null);
    setTransactionErrorMessage("");
  }

  async function handleTransactionSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const amount = Number(transactionAmount);

    if (!amount || amount <= 0) {
      setTransactionErrorMessage("Vul minimaal de kosten in.");
      return;
    }

    const transactionDateValue = getDateFromInput(transactionDate);

    try {
      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, bookId, user.uid, {
          title: transactionTitle,
          amount,
          type: transactionType,
          date: transactionDateValue,
        });
      } else {
        await createTransaction(bookId, user.uid, {
          title: transactionTitle,
          amount,
          type: transactionType,
          date: transactionDateValue,
        });
      }

      await refreshTransactions();
      setSelectedMonth(getMonthKey(transactionDateValue));
      resetTransactionForm();
    } catch (error) {
      setTransactionErrorMessage(
        error instanceof Error
          ? error.message
          : "Transactie opslaan is niet gelukt.",
      );
    }
  }

  function startEditingTransaction(transaction: Transaction) {
    setEditingTransactionId(transaction.id);
    setTransactionTitle(transaction.title);
    setTransactionAmount(String(transaction.amount));
    setTransactionType(transaction.type);
    setTransactionDate(getDateInputValue(transaction.date));
    setTransactionErrorMessage("");
  }

  async function handleDeleteTransaction(transactionId: string) {
    if (!user) {
      return;
    }

    try {
      await deleteTransaction(transactionId, bookId, user.uid);
      await refreshTransactions();

      if (editingTransactionId === transactionId) {
        resetTransactionForm();
      }
    } catch (error) {
      setTransactionErrorMessage(
        error instanceof Error
          ? error.message
          : "Transactie verwijderen is niet gelukt.",
      );
    }
  }

  if (isCheckingAuth || isLoading) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold text-slate-950">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Overzicht laden...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-sm">
        <h1 className="text-2xl font-semibold">
          Overzicht niet beschikbaar
        </h1>
        <p className="mt-2 text-sm">{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <FinancialHeader
        title={title}
        description={description}
        effectiveMonth={effectiveMonth}
        availableMonths={availableMonths}
        getMonthLabel={getMonthLabel}
        onMonthChange={setSelectedMonth}
      />

      <FinancialSummaryCards cards={summaryCards} />

      <MonthlyBalanceChart
        monthlyChartData={monthlyChartData}
        formatCurrency={formatCurrency}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <TransactionList
            transactions={monthlyTransactions}
            effectiveMonth={effectiveMonth}
            getMonthLabel={getMonthLabel}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            onEditAction={startEditingTransaction}
            onDeleteAction={handleDeleteTransaction}
          />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <TransactionForm
            title={transactionTitle}
            amount={transactionAmount}
            type={transactionType}
            date={transactionDate}
            editingTransactionId={editingTransactionId}
            errorMessage={transactionErrorMessage}
            onTitleChange={setTransactionTitle}
            onAmountChange={setTransactionAmount}
            onTypeChange={setTransactionType}
            onDateChange={setTransactionDate}
            onSubmitAction={handleTransactionSubmit}
            onCancelAction={resetTransactionForm}
          />
        </aside>
      </div>
    </section>
  );
}
