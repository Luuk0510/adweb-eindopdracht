"use client";

import { SubmitEvent, useState } from "react";
import { loginWithEmail } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch {
      setErrorMessage("E-mail of wachtwoord klopt niet. Probeer het opnieuw.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-2xl font-bold">Inloggen</h1>
        <p className="mt-2 text-sm text-gray-600">
          Log in om je huishoudboekjes te bekijken.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {errorMessage && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
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
            />
          </div>

          <button
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Inloggen
          </button>
        </form>
      </section>
    </main>
  );
}
