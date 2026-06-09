import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";

export type CategoryOverview = {
  id: string;
  name: string;
  budget: number;
  endDate: Date | null;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: "safe" | "warning" | "danger";
};

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCategoryCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatCategoryEndDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Geen";
}

function getUsagePercent(spent: number, budget: number) {
  if (budget <= 0) {
    return 0;
  }

  return (spent / budget) * 100;
}

function getStatus(spent: number, budget: number): CategoryOverview["status"] {
  if (budget <= 0) {
    return "warning";
  }

  if (spent > budget) {
    return "danger";
  }

  if (spent >= budget * 0.8) {
    return "warning";
  }

  return "safe";
}

export function getCategoryOverviews(
  categories: Category[],
  transactions: Transaction[],
) {
  return categories.map((category) => {
    const spent = transactions
      .filter((transaction) => {
        return (
          transaction.type === "expense" &&
          transaction.categoryId === category.id
        );
      })
      .reduce((total, transaction) => total + transaction.amount, 0);

    const remaining = category.maxBudget - spent;
    const usagePercent = getUsagePercent(spent, category.maxBudget);

    return {
      id: category.id,
      name: category.name,
      budget: category.maxBudget,
      endDate: category.endDate,
      spent,
      remaining,
      usagePercent,
      status: getStatus(spent, category.maxBudget),
    };
  });
}
