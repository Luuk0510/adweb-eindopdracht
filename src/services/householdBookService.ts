import {
  addDoc,
  collection,
  doc,
  DocumentData,
  FirestoreError,
  getDoc,
  onSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFriendlyFirestoreErrorMessage } from "@/services/firestoreHelpers";
import { HouseholdBook } from "@/types/householdBook";

const householdBooksCollection = collection(db, "householdBooks");
const householdBookCache = new Map<string, HouseholdBook>();

function cacheHouseholdBook(book: HouseholdBook) {
  householdBookCache.set(book.id, book);
}

export function getCachedHouseholdBook(bookId: string) {
  return householdBookCache.get(bookId) ?? null;
}

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
      const books = snapshot.docs
        .map((document: QueryDocumentSnapshot<DocumentData>) =>
          mapHouseholdBook(document.id, document.data()),
        )
        .filter((book) => !book.isArchived)
        .sort((firstBook, secondBook) => {
          return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
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

export async function getHouseholdBookById(bookId: string, userId: string) {
  try {
    const cachedBook = householdBookCache.get(bookId);

    if (cachedBook) {
      const canOpenBook =
        cachedBook.ownerId === userId ||
        cachedBook.participantIds.includes(userId);

      if (canOpenBook && !cachedBook.isArchived) {
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
