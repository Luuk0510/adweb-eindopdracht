"use client";

import { type SubmitEvent, useState } from "react";
import { registerWithEmail } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    await registerWithEmail(email, password);
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">Account aanmaken</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <input
            className="mt-1 w-full rounded border p-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Wachtwoord</label>
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </div>

        <button className="w-full rounded bg-black p-2 text-white" type="submit">
          Registreren
        </button>
      </form>
    </main>
  );
}
