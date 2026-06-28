"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { getCategoriesByHouseholdBookId } from "@/services/categoryService";
import { getTransactionsByHouseholdBookId } from "@/services/transactionService";
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  const availableMonths = getAvailableMonths(transactions);
  const monthlyChartData = getMonthlyChartData(transactions);

  const effectiveMonth =
    selectedMonth || availableMonths[0] || getMonthKey(new Date());

  const monthlyTransactions = getMonthlyTransactions(
    transactions,
    effectiveMonth,
  );
  const categoryExpenseData = getCategoryExpenseData(
    monthlyTransactions,
    categories,
  );
  const summaryCards = getFinancialSummaryCards(monthlyTransactions);

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
