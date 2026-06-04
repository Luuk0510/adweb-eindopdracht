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
