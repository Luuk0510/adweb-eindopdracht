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

export type CategoryExpenseChartPoint = {
  categoryName: string;
  amount: number;
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
              <XAxis
                dataKey="categoryName"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                width={90}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(Number(value))}
              />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value ?? 0)),
                  "Uitgaven",
                ]}
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
