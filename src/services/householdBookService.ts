import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HouseholdBook } from "@/types/householdBook";

const householdBooksCollection = collection(db, "householdBooks");

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
      .map((document) => {
        const data = document.data();

        return {
          id: document.id,
          name: data.name ?? "",
          description: data.description ?? "",
          ownerId: data.ownerId ?? "",
          participantIds: data.participantIds ?? [],
          isArchived: data.isArchived ?? false,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
      })
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
    participantIds: [],
    isArchived: false,
    createdAt: serverTimestamp(),
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