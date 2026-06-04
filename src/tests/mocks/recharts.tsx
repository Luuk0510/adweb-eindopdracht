import type { ReactNode } from "react";

export function CartesianGrid() {
  return <div data-testid="cartesian-grid" />;
}

export function Bar({ name }: { name: string }) {
  return <div>{name}</div>;
}

export function BarChart({ children }: { children: ReactNode }) {
  return <div data-testid="bar-chart">{children}</div>;
}

export function Legend() {
  return <div data-testid="legend" />;
}

export function Line({ name }: { name: string }) {
  return <div>{name}</div>;
}

export function LineChart({ children }: { children: ReactNode }) {
  return <div data-testid="line-chart">{children}</div>;
}


export function ResponsiveContainer({ children }: { children: ReactNode }) {
  return <div data-testid="responsive-container">{children}</div>;
}

type TooltipProps = {
  formatter?: (value: number) => [string, string];
};

export function Tooltip({ formatter }: TooltipProps) {
  const formattedValue = formatter ? formatter(100)[0] : "";

  return <div data-testid="tooltip">{formattedValue}</div>;
}

export function XAxis() {
  return <div data-testid="x-axis" />;
}

type YAxisProps = {
  tickFormatter?: (value: number) => string;
};

export function YAxis({ tickFormatter }: YAxisProps) {
  const formattedValue = tickFormatter ? tickFormatter(100) : "";

  return <div data-testid="y-axis">{formattedValue}</div>;
}
