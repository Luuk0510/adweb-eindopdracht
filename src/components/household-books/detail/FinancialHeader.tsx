type FinancialHeaderProps = {
  title: string;
  description: string;
  effectiveMonth: string;
  availableMonths: string[];
  getMonthLabel: (month: string) => string;
  onMonthChange: (month: string) => void;
};

export function FinancialHeader({
  title,
  description,
  effectiveMonth,
  availableMonths,
  getMonthLabel,
  onMonthChange,
}: FinancialHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 p-3 sm:w-56">
        <label
          className="text-xs font-semibold tracking-[0.18em] text-slate-500"
          htmlFor="month-select"
        >
          Bekijk per maand
        </label>
        <select
          id="month-select"
          value={effectiveMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        >
          {availableMonths.length > 0 ? (
            availableMonths.map((month) => (
              <option key={month} value={month}>
                {getMonthLabel(month)}
              </option>
            ))
          ) : (
            <option value={effectiveMonth}>{getMonthLabel(effectiveMonth)}</option>
          )}
        </select>
      </div>
    </div>
  );
}