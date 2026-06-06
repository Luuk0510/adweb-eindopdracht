"use client";

import { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import {
  getCategoriesByHouseholdBookId,
  getCachedTransactions,
  getTransactionsByHouseholdBookId,
} from "@/services/householdBookService";
import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";
import {
  getAvailableMonths,
  getCategoryExpenseData,
  getFinancialSummaryCards,
  getMonthKey,
  getMonthlyChartData,
  getMonthlyTransactions,
} from "@/utils/financialCalculations";

export function useFinancialData(bookId: string, user: User | null) {
  const cachedTransactions = getCachedTransactions(bookId);

  const [transactions, setTransactions] = useState<Transaction[]>(
    cachedTransactions ?? [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    cachedTransactions?.[0] ? getMonthKey(cachedTransactions[0].date) : "",
  );
  const [isLoading, setIsLoading] = useState(!cachedTransactions);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;
    let isMounted = true;

    async function loadFinancialData() {
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

    void loadFinancialData();

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
    selectedMonth || availableMonths[0] || getMonthKey(new Date());

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

  return {
    transactions,
    setTransactions,
    categories,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    errorMessage,
    availableMonths,
    monthlyChartData,
    effectiveMonth,
    monthlyTransactions,
    categoryExpenseData,
    summaryCards,
    refreshTransactions,
  };
}
