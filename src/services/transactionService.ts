import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Observable } from "rxjs";
import { db } from "@/lib/firebase";
import {
  getHouseholdBookById,
  getOwnedHouseholdBookById,
} from "@/services/householdBookService";
import { Transaction } from "@/types/transaction";

const transactionsCollection = collection(db, "transactions");

type TransactionInput = {
  title: string;
  amount: number;
  type: "expense" | "income";
  date: Date;
  categoryId: string | null;
};

function getDate(value: { toDate?: () => Date } | Date | null | undefined) {
  if (value instanceof Date) {
    return value;
  }

  return value?.toDate?.() ?? new Date();
}

function mapTransaction(documentId: string, data: DocumentData): Transaction {
  return {
    id: documentId,
    bookId: data.bookId ?? "",
    categoryId: data.categoryId ?? null,
    type: data.type === "income" ? "income" : "expense",
    title: data.title ?? data.description ?? "Onbekende transactie",
    amount: typeof data.amount === "number" ? data.amount : 0,
    date: getDate(data.date),
    createdBy: data.createdBy ?? "",
    createdAt: getDate(data.createdAt),
    updatedAt: getDate(data.updatedAt),
  };
}

function getTransactionTitle(title: string) {
  return title.trim().slice(0, 50) || "Geen titel";
}

function getTransactionsFromSnapshot(snapshot: QuerySnapshot<DocumentData>) {
  return snapshot.docs
    .map((transactionDocument: QueryDocumentSnapshot<DocumentData>) =>
      mapTransaction(transactionDocument.id, transactionDocument.data()),
    )
    .sort((firstTransaction, secondTransaction) => {
      return (
        secondTransaction.date.getTime() - firstTransaction.date.getTime()
      );
    });
}

function validateTransactionAmount(amount: number) {
  if (amount <= 0) {
    throw new Error("Kosten zijn verplicht.");
  }
}

async function getTransactionDocument(transactionId: string, bookId: string) {
  const transactionReference = doc(db, "transactions", transactionId);
  const transactionSnapshot = await getDoc(transactionReference);

  if (!transactionSnapshot.exists()) {
    throw new Error("Transactie bestaat niet.");
  }

  if (transactionSnapshot.data().bookId !== bookId) {
    throw new Error("Deze transactie hoort niet bij dit huishoudboekje.");
  }

  return transactionReference;
}

export async function getTransactionsByHouseholdBookId(
  bookId: string,
  userId: string,
): Promise<Transaction[]> {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  const transactionsQuery = query(
    transactionsCollection,
    where("bookId", "==", bookId),
  );

  const snapshot = await getDocs(transactionsQuery);

  return getTransactionsFromSnapshot(snapshot);
}

export function getTransactionsObservable(bookId: string) {
  const transactionsQuery = query(
    transactionsCollection,
    where("bookId", "==", bookId),
  );

  return new Observable<Transaction[]>((subscriber) => {
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        subscriber.next(getTransactionsFromSnapshot(snapshot));
      },
      (error) => {
        subscriber.error(error);
      },
    );

    return () => unsubscribe();
  });
}

export async function createTransaction(
  bookId: string,
  userId: string,
  transaction: TransactionInput,
) {
  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag transacties toevoegen.",
  );

  validateTransactionAmount(transaction.amount);

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

  return newTransaction;
}

export async function updateTransaction(
  transactionId: string,
  bookId: string,
  userId: string,
  transaction: TransactionInput,
) {
  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag transacties aanpassen.",
  );

  validateTransactionAmount(transaction.amount);

  const transactionReference = await getTransactionDocument(
    transactionId,
    bookId,
  );

  await updateDoc(transactionReference, {
    type: transaction.type,
    title: getTransactionTitle(transaction.title),
    amount: transaction.amount,
    date: transaction.date,
    categoryId: transaction.categoryId,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(
  transactionId: string,
  bookId: string,
  userId: string,
) {
  await getOwnedHouseholdBookById(
    bookId,
    userId,
    "Alleen de eigenaar mag transacties verwijderen.",
  );

  const transactionReference = await getTransactionDocument(
    transactionId,
    bookId,
  );

  await deleteDoc(transactionReference);
}
