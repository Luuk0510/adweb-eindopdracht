import { HouseholdBookNotAvailable } from "@/components/household-books/feedback/HouseholdBookNotAvailable";

export default function NotFoundPage() {
  return (
    <HouseholdBookNotAvailable
      title="Huishoudboekje niet gevonden"
      message="Dit huishoudboekje bestaat niet of is niet beschikbaar."
    />
  );
}
