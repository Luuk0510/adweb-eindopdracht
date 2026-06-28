"use client";

import { SubmitEvent, useState } from "react";
import { logout } from "@/services/authService";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useHouseholdBooks } from "@/hooks/useHouseholdBooks";
import { ArchivedHouseholdBookList } from "@/components/household-books/dashboard/ArchivedHouseholdBookList";
import { HouseholdBookForm } from "@/components/household-books/dashboard/HouseholdBookForm";
import { HouseholdBookList } from "@/components/household-books/dashboard/HouseholdBookList";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import {
  archiveHouseholdBook,
  createHouseholdBook,
  restoreHouseholdBook,
  updateHouseholdBook,
} from "@/services/householdBookService";

export default function DashboardPage() {
  const { user, isCheckingAuth } = useAuthRedirect();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { ownerBooks, participantBooks, archivedBooks, isLoading } =
    useHouseholdBooks(user);

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
      setIsFormOpen(false);
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
    setIsFormOpen(true);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setEditingBookId(null);
    setErrorMessage("");
    setIsFormOpen(false);
  }

  function startCreatingBook() {
    setName("");
    setDescription("");
    setEditingBookId(null);
    setErrorMessage("");
    setIsFormOpen(true);
  }

  async function handleLogout() {
    await logout();
  }

  if (isCheckingAuth) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p>Login controleren...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <section className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mijn huishoudboekjes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Bekijk en beheer hier je actieve huishoudboekjes.
          </p>
        </div>

        <SecondaryButton onClick={handleLogout}>Uitloggen</SecondaryButton>
      </section>

      <div className="mb-8">
        <PrimaryButton onClick={startCreatingBook}>
          Nieuw huishoudboekje
        </PrimaryButton>
      </div>

      {isFormOpen && (
        <Modal onClose={resetForm}>
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
        </Modal>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Mijn eigen huishoudboekjes</h2>
        <HouseholdBookList
          books={ownerBooks}
          isLoading={isLoading}
          currentUserId={user?.uid ?? ""}
          onEditAction={startEditingBook}
          onArchiveAction={handleArchiveBook}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Met mij gedeeld</h2>
        <HouseholdBookList
          books={participantBooks}
          isLoading={isLoading}
          currentUserId={user?.uid ?? ""}
          emptyTitle="Geen gedeelde huishoudboekjes"
          emptyMessage="Huishoudboekjes die anderen met jou delen komen hier te staan."
          onEditAction={startEditingBook}
          onArchiveAction={handleArchiveBook}
        />
      </section>

      <ArchivedHouseholdBookList
        archivedBooks={archivedBooks}
        onRestoreAction={handleRestoreBook}
      />
    </main>
  );
}
