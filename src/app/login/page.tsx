"use client";

import { FormEvent, useState } from "react";
import { loginWithEmail } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await loginWithEmail(email, password);
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">Inloggen</h1>

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
          />
        </div>

        <button className="w-full rounded bg-black p-2 text-white" type="submit">
          Inloggen
        </button>
      </form>
    </main>
  );
}