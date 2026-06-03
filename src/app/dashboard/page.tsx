"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/authService";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useHouseholdBooks } from "@/hooks/useHouseholdBooks";
import { ArchivedHouseholdBookList } from "@/components/ArchivedHouseholdBookList";
import { HouseholdBookForm } from "@/components/HouseholdBookForm";
import { HouseholdBookList } from "@/components/HouseholdBookList";
import {
  archiveHouseholdBook,
  createHouseholdBook,
  restoreHouseholdBook,
  updateHouseholdBook,
} from "@/services/householdBookService";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isCheckingAuth } = useAuthRedirect();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { books, archivedBooks, isLoading } = useHouseholdBooks(user);

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

      <HouseholdBookForm
        name={name}
        description={description}
        editingBookId={editingBookId}
        errorMessage={errorMessage}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      <HouseholdBookList
        books={books}
        isLoading={isLoading}
        currentUserId={user?.uid ?? ""}
        onEdit={startEditingBook}
        onArchive={handleArchiveBook}
      />

      <ArchivedHouseholdBookList
        archivedBooks={archivedBooks}
        onRestore={handleRestoreBook}
      />
    </main>
  );
}
