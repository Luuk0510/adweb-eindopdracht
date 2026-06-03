import { redirect } from "next/navigation";

type StatisticsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const { id } = await params;

  redirect(`/household-books/${id}/transactions`);
}
