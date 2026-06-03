import { HouseholdBookNotAvailable } from "@/components/household-books/HouseholdBookNotAvailable";

export default function NotFoundPage() {
  return (
    <HouseholdBookNotAvailable
      title="Deelnemers niet beschikbaar"
      message="Alleen de eigenaar kan deelnemers beheren."
    />
  );
}
