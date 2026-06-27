import { PrimaryLink } from "@/components/ui/PrimaryButton";
import { SecondaryLink } from "@/components/ui/SecondaryButton";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center p-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
        <h1 className="text-3xl font-bold">Huishoudboekje</h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
          Beheer je huishoudboekjes, inkomsten, uitgaven en categorieën op één
          plek.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <PrimaryLink href="/login">Inloggen</PrimaryLink>

          <SecondaryLink href="/register">Account maken</SecondaryLink>
        </div>
      </section>
    </main>
  );
}
