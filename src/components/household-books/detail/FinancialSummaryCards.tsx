type SummaryCardData = {
  label: string;
  value: string;
  accentClassName: string;
};

type FinancialSummaryCardsProps = {
  cards: SummaryCardData[];
};

export function FinancialSummaryCards({ cards }: FinancialSummaryCardsProps) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-xl border p-4 shadow-sm ${card.accentClassName}`}
        >
          <p className="text-sm font-medium">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold">{card.value}</p>
        </article>
      ))}
    </div>
  );
}
