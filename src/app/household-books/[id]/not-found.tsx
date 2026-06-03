import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-2xl font-bold">Huishoudboekje niet gevonden</h1>
        <p className="mt-2 text-sm text-gray-600">
          Dit huishoudboekje bestaat niet of is niet beschikbaar.
        </p>
      </section>
    </main>
  );
}
