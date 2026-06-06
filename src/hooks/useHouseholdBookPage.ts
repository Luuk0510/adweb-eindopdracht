"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getCachedHouseholdBook,
  getHouseholdBookById,
} from "@/services/householdBookService";
import { HouseholdBook } from "@/types/householdBook";

export function useHouseholdBookPage(bookId: string) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const cachedBook = getCachedHouseholdBook(bookId);
  const [book, setBook] = useState<HouseholdBook | null>(cachedBook);
  const [isLoadingBook, setIsLoadingBook] = useState(!cachedBook);

  useEffect(() => {
    if (!user) {
      return;
    }

    const cachedBookForPage = getCachedHouseholdBook(bookId);
    let isMounted = true;

    setBook(cachedBookForPage);
    setIsLoadingBook(!cachedBookForPage);

    async function loadBook() {
      try {
        const foundBook = await getHouseholdBookById(bookId, user.uid);

        if (isMounted) {
          setBook(foundBook);
        }
      } catch {
        if (isMounted) {
          setBook(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBook(false);
        }
      }
    }

    void loadBook();

    return () => {
      isMounted = false;
    };
  }, [bookId, user]);

  return {
    user,
    book,
    setBook,
    isCheckingAuth,
    isLoadingBook,
  };
}
