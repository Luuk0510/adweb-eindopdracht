"use client";

import Link from "next/link";
import { SubmitEvent, useEffect, useState } from "react";
import { HouseholdBookNotAvailable } from "@/components/household-books/feedback/HouseholdBookNotAvailable";
import { HouseholdBookSkeleton } from "@/components/household-books/feedback/HouseholdBookSkeleton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useHouseholdBookPage } from "@/hooks/useHouseholdBookPage";
import { addHouseholdBookParticipant } from "@/services/householdBookService";
import {
  getUserProfileByEmail,
  getUserProfileById,
} from "@/services/userService";
import { UserProfile } from "@/types/userProfile";

type HouseholdBookMembersClientProps = {
  bookId: string;
};

export function HouseholdBookMembersClient({
  bookId,
}: HouseholdBookMembersClientProps) {
  const { user, book, setBook, isCheckingAuth, isLoadingBook } =
    useHouseholdBookPage(bookId);
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantProfiles, setParticipantProfiles] = useState<UserProfile[]>(
    [],
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadParticipantProfiles() {
      if (!book) {
        return;
      }

      try {
        const profiles = await Promise.all(
          book.participantIds.map((participantId) =>
            getUserProfileById(participantId),
          ),
        );

        if (isMounted) {
          setParticipantProfiles(
            profiles.filter(
              (profile): profile is UserProfile => profile !== null,
            ),
          );
        }
      } catch {
        if (isMounted) {
          setParticipantProfiles([]);
        }
      }
    }

    void loadParticipantProfiles();

    return () => {
      isMounted = false;
    };
  }, [book]);

  function getParticipantLabel(participantId: string) {
    const participantProfile = participantProfiles.find((profile) => {
      return profile.uid === participantId;
    });

    return (
      participantProfile?.email ??
      book?.participantEmails[participantId] ??
      "E-mailadres onbekend"
    );
  }

  async function handleAddParticipant(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!user || !book) {
      return;
    }

    try {
      const participantProfile = await getUserProfileByEmail(participantEmail);

      await addHouseholdBookParticipant(
        book.id,
        user.uid,
        participantProfile.uid,
        participantProfile.email,
      );
      const participantIds = book.participantIds.includes(participantProfile.uid)
        ? book.participantIds
        : [...book.participantIds, participantProfile.uid];

      setBook({
        ...book,
        participantIds,
        participantEmails: {
          ...book.participantEmails,
          [participantProfile.uid]: participantProfile.email,
        },
      });
      if (
        !participantProfiles.some((profile) => profile.uid === participantProfile.uid)
      ) {
        setParticipantProfiles([...participantProfiles, participantProfile]);
      }
      setParticipantEmail("");
      setMessage("Deelnemer toegevoegd.");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Er is iets misgegaan.");
      }
    }
  }

  if (isCheckingAuth || isLoadingBook) {
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
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-3xl font-bold">Deelnemers van {book.name}</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={handleAddParticipant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                E-mailadres deelnemer
              </label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                type="email"
                value={participantEmail}
                onChange={(event) => setParticipantEmail(event.target.value)}
                required
              />
            </div>

            {message && (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {message}
              </p>
            )}

            <PrimaryButton type="submit">
              Deelnemer toevoegen
            </PrimaryButton>
          </form>

          <div>
            <h2 className="text-sm font-medium">Toegevoegde deelnemers</h2>
            {book.participantIds.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">
                Er zijn nog geen deelnemers.
              </p>
            ) : (
              <ul className="mt-2 list-inside list-disc break-words text-sm text-gray-600">
                {book.participantIds.map((id) => (
                  <li key={id}>{getParticipantLabel(id)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
