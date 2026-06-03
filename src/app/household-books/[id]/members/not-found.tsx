import { HouseholdBookNotAvailable } from "@/components/HouseholdBookNotAvailable";

export default function NotFoundPage() {
  return (
    <HouseholdBookNotAvailable
      title="Deelnemers niet beschikbaar"
      message="Alleen de eigenaar kan deelnemers beheren."
    />
  );
}
