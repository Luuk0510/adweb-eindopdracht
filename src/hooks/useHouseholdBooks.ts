"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { HouseholdBook } from "@/types/householdBook";
import {
  getActiveHouseholdBooksObservable,
  getArchivedHouseholdBooksObservable,
  getParticipantHouseholdBooksObservable,
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

    const activeBooksSubscription = getActiveHouseholdBooksObservable(
      user.uid,
    ).subscribe({
      next: (newBooks) => {
        setOwnerBooks(newBooks);
        setIsLoading(false);
      },
      error: () => setIsLoading(false),
    });

    const archivedBooksSubscription = getArchivedHouseholdBooksObservable(
      user.uid,
    ).subscribe({
      next: (newArchivedBooks) => {
        setArchivedBooks(newArchivedBooks);
      },
    });

    const participantBooksSubscription = getParticipantHouseholdBooksObservable(
      user.uid,
    ).subscribe({
      next: (participantBooks) => {
        setParticipantBooks(participantBooks);
      },
    });

    return () => {
      activeBooksSubscription.unsubscribe();
      archivedBooksSubscription.unsubscribe();
      participantBooksSubscription.unsubscribe();
    };
  }, [user]);

  if (!user) {
    return {
      books: [],
      ownerBooks: [],
      participantBooks: [],
      archivedBooks: [],
      isLoading: false,
    };
  }

  const currentOwnerBooks = ownerBooks.filter((book) => {
    return book.ownerId === user.uid;
  });

  const currentParticipantBooks = participantBooks.filter((book) => {
    return book.ownerId !== user.uid && book.participantIds.includes(user.uid);
  });

  const currentArchivedBooks = archivedBooks.filter((book) => {
    return book.ownerId === user.uid;
  });

  return {
    books: mergeHouseholdBooks(currentOwnerBooks, currentParticipantBooks),
    ownerBooks: sortBooksByName(currentOwnerBooks),
    participantBooks: sortBooksByName(currentParticipantBooks),
    archivedBooks: currentArchivedBooks,
    isLoading,
  };
}

function mergeHouseholdBooks(
  ownerBooks: HouseholdBook[],
  participantBooks: HouseholdBook[],
) {
  const ownerBookIds = new Set(ownerBooks.map((book) => book.id));
  const sharedBooks = participantBooks.filter(
    (book) => !ownerBookIds.has(book.id),
  );

  return [
    ...sortBooksByName(ownerBooks),
    ...sortBooksByName(sharedBooks),
  ];
}

function sortBooksByName(books: HouseholdBook[]) {
  return [...books].sort((firstBook, secondBook) => {
    return firstBook.name.localeCompare(secondBook.name, "nl-NL");
  });
}
