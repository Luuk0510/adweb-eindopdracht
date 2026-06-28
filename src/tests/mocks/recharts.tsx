import { ReactNode } from "react";

type ChartProps = {
  children?: ReactNode;
};

type DataProps = ChartProps & {
  data?: unknown[];
};

export function ResponsiveContainer({ children }: ChartProps) {
  return <div data-testid="responsive-container">{children}</div>;
}

export function LineChart({ children, data }: DataProps) {
  return <div data-testid="line-chart">{children}{data?.length}</div>;
}

export function BarChart({ children, data }: DataProps) {
  return <div data-testid="bar-chart">{children}{data?.length}</div>;
}

export function Line() {
  return <div data-testid="line" />;
}

export function Bar() {
  return <div data-testid="bar" />;
}

export function CartesianGrid() {
  return <div data-testid="cartesian-grid" />;
}

export function XAxis() {
  return <div data-testid="x-axis" />;
}

export function YAxis() {
  return <div data-testid="y-axis" />;
}

export function Tooltip() {
  return <div data-testid="tooltip" />;
}

export function Legend() {
  return <div data-testid="legend" />;
}
