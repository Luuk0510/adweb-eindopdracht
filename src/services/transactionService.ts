import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  rethrowFriendlyFirestoreError,
  toDate,
} from "@/services/firestoreHelpers";
import { getHouseholdBookById } from "@/services/householdBookService";
import { Transaction } from "@/types/transaction";

const transactionsCollection = collection(db, "transactions");
const transactionsCache = new Map<string, Transaction[]>();

type TransactionInput = {
  title: string;
  amount: number;
  type: "expense" | "income";
  date: Date;
  categoryId: string | null;
};

export function getCachedTransactions(bookId: string) {
  return transactionsCache.get(bookId) ?? null;
}

function clearTransactionsCache(bookId: string) {
  transactionsCache.delete(bookId);
}

function mapTransaction(documentId: string, data: DocumentData): Transaction {
  return {
    id: documentId,
    bookId: data.bookId ?? "",
    categoryId: data.categoryId ?? null,
    type: data.type === "income" ? "income" : "expense",
    title: data.title ?? data.description ?? "Onbekende transactie",
    amount: typeof data.amount === "number" ? data.amount : 0,
    date: toDate(data.date),
    createdBy: data.createdBy ?? "",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function getTransactionTitle(title: string) {
  return title.trim().slice(0, 50) || "Geen titel";
}

export async function getTransactionsByHouseholdBookId(
  bookId: string,
  userId: string,
): Promise<Transaction[]> {
  try {
    const cachedTransactions = transactionsCache.get(bookId);

    if (cachedTransactions) {
      return cachedTransactions;
    }

    const book = await getHouseholdBookById(bookId, userId);

    if (!book) {
      throw new Error("Huishoudboekje niet gevonden.");
    }

    const transactionsQuery = query(
      transactionsCollection,
      where("bookId", "==", bookId),
    );

    const snapshot = await getDocs(transactionsQuery);

    const transactions = snapshot.docs
      .map((transactionDocument: QueryDocumentSnapshot<DocumentData>) =>
        mapTransaction(
          transactionDocument.id,
          transactionDocument.data(),
        ),
      )
      .sort((firstTransaction, secondTransaction) => {
        return (
          secondTransaction.date.getTime() -
          firstTransaction.date.getTime()
        );
      });

    transactionsCache.set(bookId, transactions);

    return transactions;
  } catch (error) {
    rethrowFriendlyFirestoreError(error);
  }
}

export async function createTransaction(
  bookId: string,
  userId: string,
  transaction: TransactionInput,
) {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  if (book.ownerId !== userId) {
    throw new Error("Alleen de eigenaar mag transacties toevoegen.");
  }

  if (transaction.amount <= 0) {
    throw new Error("Kosten zijn verplicht.");
  }

  const newTransaction = await addDoc(transactionsCollection, {
    bookId,
    categoryId: transaction.categoryId,
    type: transaction.type,
    title: getTransactionTitle(transaction.title),
    amount: transaction.amount,
    date: transaction.date,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  clearTransactionsCache(bookId);

  return newTransaction;
}

export async function updateTransaction(
  transactionId: string,
  bookId: string,
  userId: string,
  transaction: TransactionInput,
) {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  if (book.ownerId !== userId) {
    throw new Error("Alleen de eigenaar mag transacties aanpassen.");
  }

  if (transaction.amount <= 0) {
    throw new Error("Kosten zijn verplicht.");
  }

  const transactionReference = doc(db, "transactions", transactionId);
  const transactionSnapshot = await getDoc(transactionReference);

  if (!transactionSnapshot.exists()) {
    throw new Error("Transactie bestaat niet.");
  }

  if (transactionSnapshot.data().bookId !== bookId) {
    throw new Error("Deze transactie hoort niet bij dit huishoudboekje.");
  }

  await updateDoc(transactionReference, {
    type: transaction.type,
    title: getTransactionTitle(transaction.title),
    amount: transaction.amount,
    date: transaction.date,
    categoryId: transaction.categoryId,
    updatedAt: serverTimestamp(),
  });

  clearTransactionsCache(bookId);
}

export async function deleteTransaction(
  transactionId: string,
  bookId: string,
  userId: string,
) {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  if (book.ownerId !== userId) {
    throw new Error("Alleen de eigenaar mag transacties verwijderen.");
  }

  const transactionReference = doc(db, "transactions", transactionId);
  const transactionSnapshot = await getDoc(transactionReference);

  if (!transactionSnapshot.exists()) {
    throw new Error("Transactie bestaat niet.");
  }

  if (transactionSnapshot.data().bookId !== bookId) {
    throw new Error("Deze transactie hoort niet bij dit huishoudboekje.");
  }

  await deleteDoc(transactionReference);

  clearTransactionsCache(bookId);
}
