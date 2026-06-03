export type SummaryCardData = {
  label: string;
  value: string;
  accentClassName: string;
  helper: string;
};

type FinancialSummaryCardsProps = {
  cards: SummaryCardData[];
};

export function FinancialSummaryCards({ cards }: FinancialSummaryCardsProps) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-2xl border p-5 shadow-sm ${card.accentClassName}`}
        >
          <p className="text-sm font-medium">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold">{card.value}</p>
          <p className="mt-2 text-sm opacity-80">{card.helper}</p>
        </article>
      ))}
    </div>
  );
}
