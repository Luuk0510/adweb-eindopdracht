"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { logout } from "@/services/authService";
import { useHouseholdBooks } from "@/hooks/useHouseholdBooks";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { books, isLoading } = useHouseholdBooks(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (isCheckingAuth) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p>Login controleren...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <section className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mijn huishoudboekjes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Bekijk hier je actieve huishoudboekjes.
          </p>
        </div>

        <button
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={handleLogout}
        >
          Uitloggen
        </button>
      </section>

      {isLoading ? (
        <section className="rounded-xl border p-6">
          <p>Huishoudboekjes laden...</p>
        </section>
      ) : books.length === 0 ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">Nog geen huishoudboekjes</h2>
          <p className="mt-2 text-gray-600">
            Je hebt nog geen actieve huishoudboekjes. Later voegen we hier een knop toe om een nieuw huishoudboekje te maken.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {books.map((book) => (
            <article
              key={book.id}
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{book.name}</h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {book.description || "Geen omschrijving ingevuld."}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}