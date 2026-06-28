import {
  addDoc,
  collection,
  doc,
  DocumentData,
  FirestoreError,
  getDoc,
  onSnapshot,
  Query,
  QuerySnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Observable } from "rxjs";
import { db } from "@/lib/firebase";
import { HouseholdBook } from "@/types/householdBook";

const householdBooksCollection = collection(db, "householdBooks");

function getParticipantEmails(data: DocumentData) {
  if (
    typeof data.participantEmails === "object" &&
    data.participantEmails !== null
  ) {
    return data.participantEmails as Record<string, string>;
  }

  return {};
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
    participantEmails: getParticipantEmails(data),
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

function getBooksObservable(householdBooksQuery: Query<DocumentData>) {
  return new Observable<HouseholdBook[]>((subscriber) => {
    const unsubscribe = onSnapshot(
      householdBooksQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        subscriber.next(getBooksFromSnapshot(snapshot));
      },
      (error) => {
        handleSnapshotError(error);
        subscriber.error(error);
      },
    );

    return () => unsubscribe();
  });
}

export function getActiveHouseholdBooksObservable(userId: string) {
  const householdBooksQuery = query(
    householdBooksCollection,
    where("ownerId", "==", userId),
    where("isArchived", "==", false),
  );

  return getBooksObservable(householdBooksQuery);
}

export function getParticipantHouseholdBooksObservable(userId: string) {
  const householdBooksQuery = query(
    householdBooksCollection,
    where("participantIds", "array-contains", userId),
  );

  return new Observable<HouseholdBook[]>((subscriber) => {
    const subscription = getBooksObservable(householdBooksQuery).subscribe({
      next: (books) => {
        subscriber.next(
          books.filter((book) => {
            return !book.isArchived;
          }),
        );
      },
      error: (error) => subscriber.error(error),
    });

    return () => subscription.unsubscribe();
  });
}

export function getArchivedHouseholdBooksObservable(userId: string) {
  const householdBooksQuery = query(
    householdBooksCollection,
    where("ownerId", "==", userId),
    where("isArchived", "==", true),
  );

  return getBooksObservable(householdBooksQuery);
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
    participantEmails: {},
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
    participantEmails: getParticipantEmails(bookData),
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
    participantEmails: getParticipantEmails(bookData),
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
    participantEmails: getParticipantEmails(bookData),
    updatedAt: serverTimestamp(),
  });
}

export async function addHouseholdBookParticipant(
  bookId: string,
  ownerId: string,
  participantId: string,
  participantEmail: string,
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
  const participantEmails = getParticipantEmails(bookData);
  const newParticipantId = participantId.trim();
  const newParticipantEmail = participantEmail.trim().toLowerCase();

  if (newParticipantId === ownerId) {
    throw new Error("De eigenaar hoeft niet toegevoegd te worden.");
  }

  if (participantIds.includes(newParticipantId)) {
    return updateDoc(bookReference, {
      participantEmails: {
        ...participantEmails,
        [newParticipantId]: newParticipantEmail,
      },
      updatedAt: serverTimestamp(),
    });
  }

  return updateDoc(bookReference, {
    participantIds: [...participantIds, newParticipantId],
    participantEmails: {
      ...participantEmails,
      [newParticipantId]: newParticipantEmail,
    },
    updatedAt: serverTimestamp(),
  });
}
