import {
  collection,
  onSnapshot,
  query,
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