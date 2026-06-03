import Link from "next/link";
import { FinancialOverview } from "@/components/household-books/FinancialOverview";

type TransactionsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionsPage({
  params,
}: TransactionsPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <Link className="text-sm underline" href="/dashboard">
        Terug naar dashboard
      </Link>

      <FinancialOverview
        bookId={id}
        title="Overzicht van uitgaven en inkomsten"
        description="Bekijk je financiële bewegingen op datum, filter per maand en zie meteen welke balans je opbouwt binnen dit huishoudboekje."
        mode="overview"
      />
    </main>
  );
}
