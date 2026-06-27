"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export function useAuthRedirect() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsCheckingAuth(false);
        router.push("/login");
        return;
      }

      setUser(currentUser);
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  return {
    user,
    isCheckingAuth,
  };
}
