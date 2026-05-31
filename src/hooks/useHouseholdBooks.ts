"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { HouseholdBook } from "@/types/householdBook";
import {
  listenToActiveHouseholdBooks,
  listenToArchivedHouseholdBooks,
} from "@/services/householdBookService";

export function useHouseholdBooks(user: User | null) {
  const [books, setBooks] = useState<HouseholdBook[]>([]);
  const [archivedBooks, setArchivedBooks] = useState<HouseholdBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeActiveBooks = listenToActiveHouseholdBooks(
      user.uid,
      (newBooks) => {
        setBooks(newBooks);
        setIsLoading(false);
      },
    );

    const unsubscribeArchivedBooks = listenToArchivedHouseholdBooks(
      user.uid,
      (newArchivedBooks) => {
        setArchivedBooks(newArchivedBooks);
      },
    );

    return () => {
      unsubscribeActiveBooks();
      unsubscribeArchivedBooks();
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
    books,
    archivedBooks,
    isLoading,
  };
}
