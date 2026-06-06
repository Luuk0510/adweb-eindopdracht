import Link from "next/link";

type HouseholdBookNotAvailableProps = {
  title: string;
  message: string;
};

export function HouseholdBookNotAvailable({
  title,
  message,
}: HouseholdBookNotAvailableProps) {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </section>
    </main>
  );
}
