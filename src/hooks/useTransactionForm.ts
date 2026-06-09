"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { User } from "firebase/auth";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/services/transactionService";
import { Transaction } from "@/types/transaction";
import {
  getDateFromInput,
  getDateInputValue,
  getMonthKey,
} from "@/utils/financialCalculations";

type UseTransactionFormOptions = {
  bookId: string;
  user: User | null;
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  refreshTransactions: () => Promise<void>;
  setSelectedMonth: (month: string) => void;
};

export function useTransactionForm({
  bookId,
  user,
  transactions,
  setTransactions,
  refreshTransactions,
  setSelectedMonth,
}: UseTransactionFormOptions) {
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

  async function handleDropTransactionOnCategory(
    transactionId: string,
    categoryId: string | null,
  ) {
    if (!user) {
      return;
    }

    const transaction = transactions.find(
      (currentTransaction) => currentTransaction.id === transactionId,
    );

    if (!transaction) {
      return;
    }

    const previousTransactions = transactions;

    setTransactions((currentTransactions) =>
      currentTransactions.map((currentTransaction) =>
        currentTransaction.id === transactionId
          ? { ...currentTransaction, categoryId }
          : currentTransaction,
      ),
    );

    try {
      await updateTransaction(transactionId, bookId, user.uid, {
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        categoryId,
      });
      setTransactionErrorMessage("");
    } catch (error) {
      setTransactions(previousTransactions);
      setTransactionErrorMessage(
        error instanceof Error
          ? error.message
          : "Categorie koppelen is niet gelukt.",
      );
    }
  }

  return {
    transactionTitle,
    transactionAmount,
    transactionType,
    transactionCategoryId,
    transactionDate,
    editingTransactionId,
    transactionErrorMessage,
    setTransactionTitle,
    setTransactionAmount,
    setTransactionType,
    setTransactionCategoryId,
    setTransactionDate,
    resetTransactionForm,
    handleTransactionSubmit,
    startEditingTransaction,
    handleDeleteTransaction,
    handleDropTransactionOnCategory,
  };
}
