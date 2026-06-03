import { redirect } from "next/navigation";

type TransactionsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionsPage({
  params,
}: TransactionsPageProps) {
  const { id } = await params;

  redirect(`/household-books/${id}`);
}
