import {
  addDoc,
  collection,
  doc,
  DocumentData,
  FirestoreError,
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
import { db } from "@/lib/firebase";
import { Category } from "@/types/category";
import { HouseholdBook } from "@/types/householdBook";
import { Transaction } from "@/types/transaction";

const householdBooksCollection = collection(db, "householdBooks");
const transactionsCollection = collection(db, "transactions");
const categoriesCollection = collection(db, "categories");
const householdBookCache = new Map<string, HouseholdBook>();
const transactionsCache = new Map<string, Transaction[]>();
const categoriesCache = new Map<string, Category[]>();

function cacheHouseholdBook(book: HouseholdBook) {
  householdBookCache.set(book.id, book);
}

export function getCachedHouseholdBook(bookId: string) {
  return householdBookCache.get(bookId) ?? null;
}

export function getCachedTransactions(bookId: string) {
  return transactionsCache.get(bookId) ?? null;
}

function handleSnapshotError(error: FirestoreError) {
  if (error.code === "permission-denied") {
    return;
  }

  console.error(error.message);
}

function isPermissionDeniedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  );
}

function getFriendlyFirestoreErrorMessage(error: unknown) {
  if (isPermissionDeniedError(error)) {
    return "Je hebt hier geen toegang toe. Controleer je rechten of probeer het later opnieuw.";
  }

  return null;
}

function rethrowFriendlyFirestoreError(error: unknown): never {
  const friendlyMessage = getFriendlyFirestoreErrorMessage(error);

  if (friendlyMessage) {
    throw new Error(friendlyMessage);
  }

  throw error;
}

function mapHouseholdBook(
  documentId: string,
  data: DocumentData,
): HouseholdBook {
  return {
    id: documentId,
    name: data.name ?? "",
    description: data.description ?? "",
    ownerId: data.ownerId ?? "",
    participantIds: data.participantIds ?? [],
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

function mapCategory(documentId: string, data: DocumentData): Category {
  return {
    id: documentId,
    bookId: data.bookId ?? "",
    name: data.name ?? "Onbekende categorie",
    maxBudget: typeof data.maxBudget === "number" ? data.maxBudget : 0,
    endDate: data.endDate ? toDate(data.endDate) : null,
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

  return onSnapshot(
    householdBooksQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const books = snapshot.docs
        .map((document: QueryDocumentSnapshot<DocumentData>) =>
          mapHouseholdBook(document.id, document.data()),
        )
        .sort((firstBook, secondBook) => {
          return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
        });

      callback(books);
    },
    (error) => {
      handleSnapshotError(error);
      callback([]);
    },
  );
}

export function listenToParticipantHouseholdBooks(
  userId: string,
  callback: (books: HouseholdBook[]) => void,
) {
  const householdBooksQuery = query(
    householdBooksCollection,
    where("participantIds", "array-contains", userId),
    where("isArchived", "==", false),
  );

  return onSnapshot(
    householdBooksQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const books = snapshot.docs
        .map((document: QueryDocumentSnapshot<DocumentData>) =>
          mapHouseholdBook(document.id, document.data()),
        )
        .sort((firstBook, secondBook) => {
          return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
        });

      callback(books);
    },
    (error) => {
      handleSnapshotError(error);
      callback([]);
    },
  );
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

  return onSnapshot(
    householdBooksQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const books = snapshot.docs
        .map((document: QueryDocumentSnapshot<DocumentData>) =>
          mapHouseholdBook(document.id, document.data()),
        )
        .sort((firstBook, secondBook) => {
          return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
        });

      callback(books);
    },
    (error) => {
      handleSnapshotError(error);
      callback([]);
    },
  );
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
    participantIds: [],
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getHouseholdBookById(
  bookId: string,
  userId: string,
) {
  try {
    const cachedBook = householdBookCache.get(bookId);

    if (cachedBook) {
      const isParticipant =
        cachedBook.ownerId === userId ||
        cachedBook.participantIds.includes(userId);

      if (isParticipant && !cachedBook.isArchived) {
        return cachedBook;
      }
    }

    const bookReference = doc(db, "householdBooks", bookId);
    const bookSnapshot = await getDoc(bookReference);

    if (!bookSnapshot.exists()) {
      return null;
    }

    const data = bookSnapshot.data();

    const participantIds = data.participantIds ?? [];
    const isParticipant = participantIds.includes(userId);

    if ((data.ownerId !== userId && !isParticipant) || data.isArchived) {
      return null;
    }

    const book = mapHouseholdBook(bookSnapshot.id, data);

    cacheHouseholdBook(book);

    return book;
  } catch (error) {
    const friendlyMessage = getFriendlyFirestoreErrorMessage(error);

    if (friendlyMessage) {
      throw new Error(friendlyMessage);
    }

    throw error;
  }
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

export async function getCategoriesByHouseholdBookId(
  bookId: string,
  userId: string,
): Promise<Category[]> {
  try {
    const cachedCategories = categoriesCache.get(bookId);

    if (cachedCategories) {
      return cachedCategories;
    }

    const book = await getHouseholdBookById(bookId, userId);

    if (!book) {
      throw new Error("Huishoudboekje niet gevonden.");
    }

    const categoriesQuery = query(
      categoriesCollection,
      where("bookId", "==", bookId),
    );

    const snapshot = await getDocs(categoriesQuery);

    const categories = snapshot.docs
      .map((categoryDocument: QueryDocumentSnapshot<DocumentData>) =>
        mapCategory(categoryDocument.id, categoryDocument.data()),
      )
      .sort((firstCategory, secondCategory) => {
        return firstCategory.name.localeCompare(secondCategory.name);
      });

    categoriesCache.set(bookId, categories);

    return categories;
  } catch (error) {
    rethrowFriendlyFirestoreError(error);
  }
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
    participantIds: bookData.participantIds ?? [],
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
    participantIds: bookData.participantIds ?? [],
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
    participantIds: bookData.participantIds ?? [],
    updatedAt: serverTimestamp(),
  });
}

export async function addHouseholdBookParticipant(
  bookId: string,
  ownerId: string,
  participantId: string,
) {
  if (!participantId.trim()) {
    throw new Error("Gebruiker id is verplicht.");
  }

  const bookReference = doc(db, "householdBooks", bookId);
  const bookSnapshot = await getDoc(bookReference);

  if (!bookSnapshot.exists()) {
    throw new Error("Huishoudboekje bestaat niet.");
  }

  const bookData = bookSnapshot.data();

  if (bookData.ownerId !== ownerId) {
    throw new Error("Alleen de eigenaar mag deelnemers toevoegen.");
  }

  const participantIds = bookData.participantIds ?? [];
  const newParticipantId = participantId.trim();

  if (newParticipantId === ownerId) {
    throw new Error("De eigenaar hoeft niet toegevoegd te worden.");
  }

  if (participantIds.includes(newParticipantId)) {
    throw new Error("Deze deelnemer is al toegevoegd.");
  }

  return updateDoc(bookReference, {
    participantIds: [...participantIds, newParticipantId],
    updatedAt: serverTimestamp(),
  });
}
