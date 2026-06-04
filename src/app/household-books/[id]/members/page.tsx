import { notFound } from "next/navigation";
import { HouseholdBookMembersClient } from "./HouseholdBookMembersClient";

type HouseholdBookMembersPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HouseholdBookMembersPage({
  params,
}: HouseholdBookMembersPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return <HouseholdBookMembersClient bookId={id} />;
}
