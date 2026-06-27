"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyChartPoint = {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyBalanceChartProps = {
  monthlyChartData: MonthlyChartPoint[];
  formatCurrency: (amount: number) => string;
};

export function MonthlyBalanceChart({
  monthlyChartData,
  formatCurrency,
}: MonthlyBalanceChartProps) {
  return (
    <article className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Maandelijkse balansgrafiek
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Bekijk inkomsten en uitgaven per maand als lijngrafiek.
          </p>
        </div>
      </div>

      {monthlyChartData.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-base font-medium text-slate-900">
            De grafiek verschijnt zodra er transacties zijn.
          </p>
        </div>
      ) : (
        <div className="mt-6 h-80 min-h-80 min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={1}>
            <LineChart
              data={monthlyChartData}
              margin={{ top: 8, right: 5, bottom: 0, left: 5 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                width={80}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatCurrency(Number(value))
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value ?? 0)),
                  name === "income" ? "Inkomsten" : "Uitgaven",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="Inkomsten"
                stroke="#059669"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Uitgaven"
                stroke="#e11d48"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
