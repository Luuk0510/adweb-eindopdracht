"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { logout } from "@/services/authService";
import { useHouseholdBooks } from "@/hooks/useHouseholdBooks";
import {
  archiveHouseholdBook,
  createHouseholdBook,
  restoreHouseholdBook,
  updateHouseholdBook,
} from "@/services/householdBookService";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { books, archivedBooks, isLoading } = useHouseholdBooks(user);

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

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!user) {
      return;
    }

    try {
      if (editingBookId) {
        await updateHouseholdBook(editingBookId, user.uid, name, description);
      } else {
        await createHouseholdBook(user.uid, name, description);
      }

      resetForm();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Er is iets misgegaan.");
      }
    }
  }

  async function handleArchiveBook(bookId: string) {
    setErrorMessage("");

    if (!user) {
      return;
    }

    try {
      await archiveHouseholdBook(bookId, user.uid);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Er is iets misgegaan.");
      }
    }
  }

  async function handleRestoreBook(bookId: string) {
    setErrorMessage("");

    if (!user) {
      return;
    }

    try {
      await restoreHouseholdBook(bookId, user.uid);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Er is iets misgegaan.");
      }
    }
  }

  function startEditingBook(
    bookId: string,
    bookName: string,
    bookDescription: string,
  ) {
    setEditingBookId(bookId);
    setName(bookName);
    setDescription(bookDescription);
    setErrorMessage("");
  }

  function resetForm() {
    setName("");
    setDescription("");
    setEditingBookId(null);
    setErrorMessage("");
  }

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
            Bekijk en beheer hier je actieve huishoudboekjes.
          </p>
        </div>

        <button
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={handleLogout}
        >
          Uitloggen
        </button>
      </section>

      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h2 className="text-xl font-semibold">
          {editingBookId ? "Huishoudboekje aanpassen" : "Nieuw huishoudboekje"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Naam *</label>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Omschrijving</label>
            <textarea
              className="mt-1 w-full rounded-lg border p-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3">
            <button
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
              type="submit"
            >
              {editingBookId ? "Wijzigingen opslaan" : "Toevoegen"}
            </button>

            {editingBookId && (
              <button
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                type="button"
                onClick={resetForm}
              >
                Annuleren
              </button>
            )}
          </div>
        </form>
      </section>

      {isLoading ? (
        <section className="rounded-xl border p-6">
          <p>Huishoudboekjes laden...</p>
        </section>
      ) : books.length === 0 ? (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-900">
          <h2 className="text-xl font-semibold">Nog geen huishoudboekjes</h2>
          <p className="mt-2 text-gray-600">
            Maak je eerste huishoudboekje aan met het formulier hierboven.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {books.map((book) => (
            <article
              key={book.id}
              className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{book.name}</h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {book.description || "Geen omschrijving ingevuld."}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  onClick={() =>
                    startEditingBook(book.id, book.name, book.description)
                  }
                >
                  Aanpassen
                </button>

                <button
                  className="rounded-lg border px-3 py-2 text-sm font-medium text-red-700"
                  onClick={() => handleArchiveBook(book.id)}
                >
                  Archiveren
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Gearchiveerde huishoudboekjes</h2>

        {archivedBooks.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            Er zijn geen gearchiveerde huishoudboekjes.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {archivedBooks.map((book) => (
              <article
                key={book.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-900"
              >
                <h3 className="text-xl font-semibold">{book.name}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {book.description || "Geen omschrijving ingevuld."}
                </p>

                <button
                  className="mt-4 rounded-lg border px-3 py-2 text-sm font-medium"
                  onClick={() => handleRestoreBook(book.id)}
                >
                  Herstellen
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
