import {
  addDoc,
  collection,
  doc,
  DocumentData,
  FirestoreError,
  getDoc,
  onSnapshot,
  QuerySnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HouseholdBook } from "@/types/householdBook";

const householdBooksCollection = collection(db, "householdBooks");

function handleSnapshotError(error: FirestoreError) {
  if (error.code === "permission-denied") {
    return;
  }

  console.error(error.message);
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

function getBooksFromSnapshot(snapshot: QuerySnapshot<DocumentData>) {
  return snapshot.docs
    .map((document) => mapHouseholdBook(document.id, document.data()))
    .sort((firstBook, secondBook) => {
      return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
    });
}

function getHouseholdBookText(value: string) {
  return value.trim().slice(0, 50);
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
      callback(getBooksFromSnapshot(snapshot));
    },
    (error) => {
      handleSnapshotError(error);
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
  );

  return onSnapshot(
    householdBooksQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const books = getBooksFromSnapshot(snapshot).filter((book) => {
        return !book.isArchived;
      });

      callback(books);
    },
    (error) => {
      handleSnapshotError(error);
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
      callback(getBooksFromSnapshot(snapshot));
    },
    (error) => {
      handleSnapshotError(error);
    },
  );
}

export async function createHouseholdBook(
  userId: string,
  name: string,
  description: string,
) {
  const bookName = getHouseholdBookText(name);

  if (!bookName) {
    throw new Error("Naam is verplicht.");
  }

  return addDoc(householdBooksCollection, {
    name: bookName,
    description: getHouseholdBookText(description),
    ownerId: userId,
    participantIds: [],
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
  const participantIds = data.participantIds ?? [];
  const isParticipant = participantIds.includes(userId);

  if ((data.ownerId !== userId && !isParticipant) || data.isArchived) {
    return null;
  }

  return mapHouseholdBook(bookSnapshot.id, data);
}

export async function getOwnedHouseholdBookById(
  bookId: string,
  userId: string,
  errorMessage: string,
) {
  const book = await getHouseholdBookById(bookId, userId);

  if (!book) {
    throw new Error("Huishoudboekje niet gevonden.");
  }

  if (book.ownerId !== userId) {
    throw new Error(errorMessage);
  }

  return book;
}

async function getOwnedBookDocument(
  bookId: string,
  userId: string,
  notOwnerMessage: string,
) {
  const bookReference = doc(db, "householdBooks", bookId);
  const bookSnapshot = await getDoc(bookReference);

  if (!bookSnapshot.exists()) {
    throw new Error("Huishoudboekje bestaat niet.");
  }

  const bookData = bookSnapshot.data();

  if (bookData.ownerId !== userId) {
    throw new Error(notOwnerMessage);
  }

  return { bookReference, bookData };
}

export async function archiveHouseholdBook(bookId: string, userId: string) {
  const { bookReference, bookData } = await getOwnedBookDocument(
    bookId,
    userId,
    "Je mag alleen je eigen huishoudboekjes archiveren.",
  );

  return updateDoc(bookReference, {
    participantIds: bookData.participantIds ?? [],
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreHouseholdBook(bookId: string, userId: string) {
  const { bookReference, bookData } = await getOwnedBookDocument(
    bookId,
    userId,
    "Je mag alleen je eigen huishoudboekjes herstellen.",
  );

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
  const bookName = getHouseholdBookText(name);

  if (!bookName) {
    throw new Error("Naam is verplicht.");
  }

  const { bookReference, bookData } = await getOwnedBookDocument(
    bookId,
    userId,
    "Je mag alleen je eigen huishoudboekjes aanpassen.",
  );

  return updateDoc(bookReference, {
    name: bookName,
    description: getHouseholdBookText(description),
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

  const { bookReference, bookData } = await getOwnedBookDocument(
    bookId,
    ownerId,
    "Alleen de eigenaar mag deelnemers toevoegen.",
  );

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
