import { HouseholdBookNotAvailable } from "@/components/household-books/feedback/HouseholdBookNotAvailable";

export default function NotFoundPage() {
  return (
    <HouseholdBookNotAvailable
      title="Categorieen niet beschikbaar"
      message="Dit categorie overzicht bestaat niet of is niet beschikbaar."
    />
  );
}
