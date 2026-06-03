import { notFound } from "next/navigation";
import { HouseholdBookDetailClient } from "./HouseholdBookDetailClient";

type HouseholdBookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HouseholdBookPage({
  params,
}: HouseholdBookPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return <HouseholdBookDetailClient bookId={id} />;
}
