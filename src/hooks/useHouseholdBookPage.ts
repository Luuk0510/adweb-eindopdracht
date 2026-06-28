"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getHouseholdBookById } from "@/services/householdBookService";
import { HouseholdBook } from "@/types/householdBook";

export function useHouseholdBookPage(bookId: string) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const [book, setBook] = useState<HouseholdBook | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user.uid;
    let isMounted = true;

    async function loadBook() {
      try {
        const foundBook = await getHouseholdBookById(bookId, userId);

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
