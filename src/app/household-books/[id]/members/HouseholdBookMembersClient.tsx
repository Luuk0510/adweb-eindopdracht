"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { HouseholdBookNotAvailable } from "@/components/HouseholdBookNotAvailable";
import { HouseholdBookSkeleton } from "@/components/HouseholdBookSkeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  addHouseholdBookParticipant,
  getHouseholdBookById,
} from "@/services/householdBookService";
import { HouseholdBook } from "@/types/householdBook";

type HouseholdBookMembersClientProps = {
  bookId: string;
};

export function HouseholdBookMembersClient({
  bookId,
}: HouseholdBookMembersClientProps) {
  const { user, isCheckingAuth } = useAuthRedirect();
  const [book, setBook] = useState<HouseholdBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participantId, setParticipantId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadBook() {
      if (!user) {
        return;
      }

      try {
        const foundBook = await getHouseholdBookById(bookId, user.uid);
        setBook(foundBook);
      } catch {
        setBook(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadBook();
  }, [bookId, user]);

  async function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!user || !book) {
      return;
    }

    try {
      await addHouseholdBookParticipant(book.id, user.uid, participantId);
      setBook({
        ...book,
        participantIds: [...book.participantIds, participantId.trim()],
      });
      setParticipantId("");
      setMessage("Deelnemer toegevoegd.");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Er is iets misgegaan.");
      }
    }
  }

  if (isCheckingAuth || isLoading) {
    return <HouseholdBookSkeleton />;
  }

  if (!book || book.ownerId !== user?.uid) {
    return (
      <HouseholdBookNotAvailable
        title="Deelnemers niet beschikbaar"
        message="Alleen de eigenaar kan deelnemers beheren."
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-3xl font-bold">Deelnemers</h1>
        <p className="mt-2 text-sm text-gray-600">{book.name}</p>

        <form onSubmit={handleAddParticipant} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Firebase gebruiker id
            </label>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              value={participantId}
              onChange={(event) => setParticipantId(event.target.value)}
              required
            />
          </div>

          {message && (
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              {message}
            </p>
          )}

          <button
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Deelnemer toevoegen
          </button>
        </form>

        <div className="mt-6">
          <h2 className="text-sm font-medium">Toegevoegde deelnemers</h2>
          {book.participantIds.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">
              Er zijn nog geen deelnemers.
            </p>
          ) : (
            <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
              {book.participantIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
