import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HouseholdBook } from "@/types/householdBook";
import { Transaction } from "@/types/transaction";

const householdBooksCollection = collection(db, "householdBooks");
const transactionsCollection = collection(db, "transactions");

function mapHouseholdBook(
  documentId: string,
  data: DocumentData,
): HouseholdBook {
  return {
    id: documentId,
    name: data.name ?? "",
    description: data.description ?? "",
    ownerId: data.ownerId ?? "",
    isArchived: data.isArchived ?? false,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return new Date();
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

export function listenToActiveHouseholdBooks(
  userId: string,
  callback: (books: HouseholdBook[]) => void,
) {
  const householdBooksQuery = query(
    householdBooksCollection,
    where("ownerId", "==", userId),
    where("isArchived", "==", false),
  );

  return onSnapshot(householdBooksQuery, (snapshot) => {
    const books = snapshot.docs
      .map((document) => mapHouseholdBook(document.id, document.data()))
      .sort((firstBook, secondBook) => {
        return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
      });

    callback(books);
  });
}

export function listenToArchivedHouseholdBooks(
  userId: string,
  callback: (books: HouseholdBook[]) => void,
) {
  const householdBooksQuery = query(
    householdBooksCollection,
    where("ownerId", "==", userId),
    where("isArchived", "==", true),
  );

  return onSnapshot(householdBooksQuery, (snapshot) => {
    const books = snapshot.docs
      .map((document) => mapHouseholdBook(document.id, document.data()))
      .sort((firstBook, secondBook) => {
        return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
      });

    callback(books);
  });
}

export async function createHouseholdBook(
  userId: string,
  name: string,
  description: string,
) {
  if (!name.trim()) {
    throw new Error("Naam is verplicht.");
  }

  return addDoc(householdBooksCollection, {
    name: name.trim(),
    description: description.trim(),
    ownerId: userId,
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getHouseholdBookById(bookId: string, userId: string) {
  const bookReference = doc(db, "householdBooks", bookId);
  const bookSnapshot = await getDoc(bookReference);

  if (!bookSnapshot.exists()) {
    return null;
  }

  const data = bookSnapshot.data();

  if (data.ownerId !== userId || data.isArchived) {
    return null;
  }

  return mapHouseholdBook(bookSnapshot.id, data);
}

export async function getTransactionsByHouseholdBookId(
  bookId: string,
  userId: string,
) {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  const transactionsQuery = query(
    transactionsCollection,
    where("bookId", "==", bookId),
  );

  const snapshot = await getDocs(transactionsQuery);

  return snapshot.docs
    .map((transactionDocument) => {
      return mapTransaction(transactionDocument.id, transactionDocument.data());
    })
    .sort((firstTransaction, secondTransaction) => {
      return secondTransaction.date.getTime() - firstTransaction.date.getTime();
    });
}

export async function seedDemoTransactionsForHouseholdBook(
  bookId: string,
  userId: string,
) {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  const existingTransactionsQuery = query(
    transactionsCollection,
    where("bookId", "==", bookId),
  );
  const existingTransactionsSnapshot = await getDocs(existingTransactionsQuery);

  if (!existingTransactionsSnapshot.empty) {
    throw new Error("Er staan al transacties in dit huishoudboekje.");
  }

  const now = new Date();
  const demoTransactions = [
    {
      title: "Salaris",
      amount: 2450,
      type: "income" as const,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
    },
    {
      title: "Boodschappen",
      amount: 132.45,
      type: "expense" as const,
      date: new Date(now.getFullYear(), now.getMonth(), 3),
    },
    {
      title: "Huur",
      amount: 875,
      type: "expense" as const,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
    },
    {
      title: "Freelance opdracht",
      amount: 420,
      type: "income" as const,
      date: new Date(now.getFullYear(), now.getMonth(), 8),
    },
    {
      title: "Energie en water",
      amount: 164.2,
      type: "expense" as const,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 24),
    },
    {
      title: "Restaurant",
      amount: 58.9,
      type: "expense" as const,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 27),
    },
  ];

  await Promise.all(
    demoTransactions.map((transaction) => {
      return addDoc(transactionsCollection, {
        bookId,
        categoryId: null,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }),
  );
}

export async function archiveHouseholdBook(bookId: string, userId: string) {
  const bookReference = doc(db, "householdBooks", bookId);
  const bookSnapshot = await getDoc(bookReference);

  if (!bookSnapshot.exists()) {
    throw new Error("Huishoudboekje bestaat niet.");
  }

  const bookData = bookSnapshot.data();

  if (bookData.ownerId !== userId) {
    throw new Error("Je mag alleen je eigen huishoudboekjes archiveren.");
  }

  return updateDoc(bookReference, {
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreHouseholdBook(bookId: string, userId: string) {
  const bookReference = doc(db, "householdBooks", bookId);
  const bookSnapshot = await getDoc(bookReference);

  if (!bookSnapshot.exists()) {
    throw new Error("Huishoudboekje bestaat niet.");
  }

  const bookData = bookSnapshot.data();

  if (bookData.ownerId !== userId) {
    throw new Error("Je mag alleen je eigen huishoudboekjes herstellen.");
  }

  return updateDoc(bookReference, {
    isArchived: false,
    updatedAt: serverTimestamp(),
  });
}

export async function updateHouseholdBook(
  bookId: string,
  userId: string,
  name: string,
  description: string,
) {
  if (!name.trim()) {
    throw new Error("Naam is verplicht.");
  }

  const bookReference = doc(db, "householdBooks", bookId);
  const bookSnapshot = await getDoc(bookReference);

  if (!bookSnapshot.exists()) {
    throw new Error("Huishoudboekje bestaat niet.");
  }

  const bookData = bookSnapshot.data();

  if (bookData.ownerId !== userId) {
    throw new Error("Je mag alleen je eigen huishoudboekjes aanpassen.");
  }

  return updateDoc(bookReference, {
    name: name.trim(),
    description: description.trim(),
    updatedAt: serverTimestamp(),
  });
}
