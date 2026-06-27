"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryExpenseChartPoint = {
  categoryName: string;
  amount: number;
  budget: number | null;
};

type CategoryExpenseBarChartProps = {
  categoryExpenseData: CategoryExpenseChartPoint[];
  formatCurrency: (amount: number) => string;
};

export function CategoryExpenseBarChart({
  categoryExpenseData,
  formatCurrency,
}: CategoryExpenseBarChartProps) {
  return (
    <article className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Uitgaven per categorie
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Vergelijk hoeveel er per categorie is uitgegeven.
          </p>
        </div>
      </div>

      {categoryExpenseData.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-base font-medium text-slate-900">
            De staafdiagram verschijnt zodra er uitgaven zijn.
          </p>
        </div>
      ) : (
        <div className="mt-6 h-80 min-h-80 min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={1}>
            <BarChart
              data={categoryExpenseData}
              margin={{ top: 8, right: 8, bottom: 8, left: 24 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="categoryName" tickLine={false} axisLine={false} />
              <YAxis
                width={90}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(Number(value))}
              />
              <Tooltip
                content={
                  <CategoryExpenseTooltip formatCurrency={formatCurrency} />
                }
              />
              <Bar
                dataKey="amount"
                name="Uitgaven"
                fill="#e11d48"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

type CategoryExpenseTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: CategoryExpenseChartPoint;
  }>;
  formatCurrency: (amount: number) => string;
};

function CategoryExpenseTooltip({
  active,
  payload,
  formatCurrency,
}: CategoryExpenseTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const category = payload[0].payload;
  const isOverBudget =
    category.budget !== null && category.amount > category.budget;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-medium text-slate-950">{category.categoryName}</p>
      <p className="mt-1 text-slate-700">
        Uitgaven: {formatCurrency(category.amount)}
      </p>
      <p className={isOverBudget ? "text-rose-700" : "text-slate-700"}>
        Budget:{" "}
        {category.budget === null
          ? "Geen budget"
          : formatCurrency(category.budget)}
      </p>
    </div>
  );
}
