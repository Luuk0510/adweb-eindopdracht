"use client";

import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { registerWithEmail } from "@/services/authService";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await registerWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/email-already-in-use") {
          setError("Het opgegeven e-mailadres is al in gebruik.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Er is een onbekende fout opgetreden.");
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-2xl font-bold">Account aanmaken</h1>
        <p className="mt-2 text-sm text-gray-600">
          Maak een account aan om je huishoudboekjes te beheren.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium">E-mail</label>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Wachtwoord</label>
            <input
              className="mt-1 w-full rounded-lg border p-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>

          <PrimaryButton className="w-full" type="submit">
            Registreren
          </PrimaryButton>
        </form>
      </section>
    </main>
  );
}
