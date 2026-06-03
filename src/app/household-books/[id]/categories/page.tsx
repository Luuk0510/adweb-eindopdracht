import { notFound } from "next/navigation";
import { HouseholdBookCategoriesClient } from "./HouseholdBookCategoriesClient";

type HouseholdBookCategoriesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HouseholdBookCategoriesPage({
  params,
}: HouseholdBookCategoriesPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return <HouseholdBookCategoriesClient bookId={id} />;
}
