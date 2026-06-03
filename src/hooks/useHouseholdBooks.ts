"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { HouseholdBook } from "@/types/householdBook";
import {
  listenToActiveHouseholdBooks,
  listenToArchivedHouseholdBooks,
  listenToParticipantHouseholdBooks,
} from "@/services/householdBookService";

export function useHouseholdBooks(user: User | null) {
  const [ownerBooks, setOwnerBooks] = useState<HouseholdBook[]>([]);
  const [participantBooks, setParticipantBooks] = useState<HouseholdBook[]>([]);
  const [archivedBooks, setArchivedBooks] = useState<HouseholdBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeActiveBooks = listenToActiveHouseholdBooks(
      user.uid,
      (newBooks) => {
        setOwnerBooks(newBooks);
        setIsLoading(false);
      },
    );

    const unsubscribeArchivedBooks = listenToArchivedHouseholdBooks(
      user.uid,
      (newArchivedBooks) => {
        setArchivedBooks(newArchivedBooks);
      },
    );

    const unsubscribeParticipantBooks = listenToParticipantHouseholdBooks(
      user.uid,
      (participantBooks) => {
        setParticipantBooks(participantBooks);
      },
    );

    return () => {
      unsubscribeActiveBooks();
      unsubscribeArchivedBooks();
      unsubscribeParticipantBooks();
    };
  }, [user]);

  if (!user) {
    return {
      books: [],
      archivedBooks: [],
      isLoading: false,
    };
  }

  return {
    books: mergeHouseholdBooks(ownerBooks, participantBooks),
    archivedBooks,
    isLoading,
  };
}

function mergeHouseholdBooks(
  ownerBooks: HouseholdBook[],
  participantBooks: HouseholdBook[],
) {
  const booksById = new Map<string, HouseholdBook>();

  ownerBooks.forEach((book) => booksById.set(book.id, book));
  participantBooks.forEach((book) => booksById.set(book.id, book));

  return Array.from(booksById.values()).sort((firstBook, secondBook) => {
    return secondBook.createdAt.getTime() - firstBook.createdAt.getTime();
  });
}
