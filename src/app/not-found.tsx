import { HouseholdBookNotAvailable } from "@/components/household-books/feedback/HouseholdBookNotAvailable";

export default function NotFoundPage() {
  return (
    <HouseholdBookNotAvailable
      title="Pagina niet gevonden"
      message="Deze pagina bestaat niet of is niet beschikbaar."
    />
  );
}
