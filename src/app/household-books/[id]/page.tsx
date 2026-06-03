import { redirect } from "next/navigation";

type HouseholdBookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HouseholdBookPage({
  params,
}: HouseholdBookPageProps) {
  const { id } = await params;

  redirect(`/household-books/${id}/transactions`);
}
