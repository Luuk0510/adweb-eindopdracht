"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { HouseholdBook } from "@/types/householdBook";
import { listenToActiveHouseholdBooks } from "@/services/householdBookService";

export function useHouseholdBooks(user: User | null) {
  const [books, setBooks] = useState<HouseholdBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = listenToActiveHouseholdBooks(user.uid, (newBooks) => {
      setBooks(newBooks);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return {
      books: [],
      isLoading: false,
    };
  }

  return {
    books,
    isLoading,
  };
}