"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  createTransaction,
  deleteTransaction,
  getCategoriesByHouseholdBookId,
  getCachedTransactions,
  getTransactionsByHouseholdBookId,
  updateTransaction,
} from "@/services/householdBookService";

import { CategoryExpenseBarChart } from "@/components/household-books/CategoryExpenseBarChart";
import { FinancialSummaryCards } from "@/components/household-books/FinancialSummaryCards";
import { MonthlyBalanceChart } from "@/components/household-books/MonthlyBalanceChart";
import { TransactionForm } from "@/components/household-books/TransactionForm";
import { TransactionList } from "@/components/household-books/TransactionList";
import { SecondaryLink } from "@/components/ui/SecondaryButton";

import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";
import {
  formatCurrency,
  formatDate,
  getAvailableMonths,
  getCategoryExpenseData,
  getDateFromInput,
  getDateInputValue,
  getFinancialSummaryCards,
  getMonthKey,
  getMonthLabel,
  getMonthlyChartData,
  getMonthlyTransactions,
} from "@/utils/financialCalculations";

type FinancialOverviewProps = {
  bookId: string;
  title: string;
  description: string;
  categoryOverviewHref: string;
};

export function FinancialOverview({
  bookId,
  title,
  description,
  categoryOverviewHref,
}: FinancialOverviewProps) {
  const { user, isCheckingAuth } = useAuthRedirect();

  const cachedTransactions = getCachedTransactions(bookId);

  const [transactions, setTransactions] = useState<Transaction[]>(
    cachedTransactions ?? [],
  );
  const [categories, setCategories] = useState<Category[]>([]);

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
  const [transactionCategoryId, setTransactionCategoryId] = useState("");
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
        const [fetchedTransactions, fetchedCategories] = await Promise.all([
          getTransactionsByHouseholdBookId(bookId, userId),
          getCategoriesByHouseholdBookId(bookId, userId),
        ]);

        if (!isMounted) {
          return;
        }

        setErrorMessage("");
        setTransactions(fetchedTransactions ?? []);
        setCategories(fetchedCategories ?? []);

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

  const availableMonths = useMemo(() => {
    return getAvailableMonths(transactions);
  }, [transactions]);

  const monthlyChartData = useMemo(() => {
    return getMonthlyChartData(transactions);
  }, [transactions]);

  const effectiveMonth =
    selectedMonth ||
    availableMonths[0] ||
    getMonthKey(new Date());

  const monthlyTransactions = useMemo(() => {
    return getMonthlyTransactions(transactions, effectiveMonth);
  }, [effectiveMonth, transactions]);

  const categoryExpenseData = useMemo(() => {
    return getCategoryExpenseData(monthlyTransactions, categories);
  }, [categories, monthlyTransactions]);

  const summaryCards = useMemo(() => {
    return getFinancialSummaryCards(monthlyTransactions);
  }, [monthlyTransactions]);

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
    setTransactionCategoryId("");
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
          categoryId: transactionCategoryId || null,
        });
      } else {
        await createTransaction(bookId, user.uid, {
          title: transactionTitle,
          amount,
          type: transactionType,
          date: transactionDateValue,
          categoryId: transactionCategoryId || null,
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
    setTransactionCategoryId(transaction.categoryId ?? "");
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
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SecondaryLink href={categoryOverviewHref}>
            Categorie overzicht
          </SecondaryLink>

          <div className="rounded-xl border border-slate-200 p-3 sm:w-56">
            <label
              className="text-xs font-semibold tracking-[0.18em] text-slate-500"
              htmlFor="month-select"
            >
              Bekijk per maand
            </label>
            <select
              id="month-select"
              value={effectiveMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {getMonthLabel(month)}
                  </option>
                ))
              ) : (
                <option value={effectiveMonth}>
                  {getMonthLabel(effectiveMonth)}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      <FinancialSummaryCards cards={summaryCards} />

      <div className="grid gap-6 xl:grid-cols-2">
        <MonthlyBalanceChart
          monthlyChartData={monthlyChartData}
          formatCurrency={formatCurrency}
        />

        <CategoryExpenseBarChart
          categoryExpenseData={categoryExpenseData}
          formatCurrency={formatCurrency}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <TransactionList
            transactions={monthlyTransactions}
            effectiveMonth={effectiveMonth}
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
            categoryId={transactionCategoryId}
            categories={categories}
            date={transactionDate}
            editingTransactionId={editingTransactionId}
            errorMessage={transactionErrorMessage}
            onTitleChange={setTransactionTitle}
            onAmountChange={setTransactionAmount}
            onTypeChange={setTransactionType}
            onCategoryChange={setTransactionCategoryId}
            onDateChange={setTransactionDate}
            onSubmitAction={handleTransactionSubmit}
            onCancelAction={resetTransactionForm}
          />
        </aside>
      </div>
    </section>
  );
}
