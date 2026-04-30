import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center p-8">
      <h1 className="text-4xl font-bold">Huishoudboekje</h1>

      <p className="mt-4 max-w-xl text-gray-600">
        Beheer je huishoudboekjes, inkomsten, uitgaven en categorieën op één plek.
      </p>

      <div className="mt-8 flex gap-4">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/login">
          Inloggen
        </Link>

        <Link className="rounded border px-4 py-2" href="/register">
          Account maken
        </Link>
      </div>
    </main>
  );
}