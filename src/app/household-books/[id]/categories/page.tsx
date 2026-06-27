import { notFound } from "next/navigation";
import { HouseholdBookCategoriesClient } from "./HouseholdBookCategoriesClient";

type HouseholdBookCategoriesPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
};

export default async function HouseholdBookCategoriesPage({
  params,
  searchParams,
}: HouseholdBookCategoriesPageProps) {
  const { id } = await params;
  const { from } = await searchParams;

  if (!id) {
    notFound();
  }

  return (
    <HouseholdBookCategoriesClient
      bookId={id}
      cameFromDashboard={from === "dashboard"}
    />
  );
}
