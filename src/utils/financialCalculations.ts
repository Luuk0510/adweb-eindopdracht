import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";

const monthFormatter = new Intl.DateTimeFormat("nl-NL", {
  month: "long",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

export function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

export function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return monthFormatter.format(new Date(year, month - 1, 1));
}

export function formatDate(date: Date) {
  return dayFormatter.format(date);
}

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateFromInput(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function getAvailableMonths(transactions: Transaction[]) {
  return Array.from(
    new Set(transactions.map((transaction) => getMonthKey(transaction.date))),
  ).sort((firstMonth, secondMonth) => secondMonth.localeCompare(firstMonth));
}

export function getMonthlyTransactions(
  transactions: Transaction[],
  monthKey: string,
) {
  return transactions
    .filter((transaction) => getMonthKey(transaction.date) === monthKey)
    .sort(
      (firstTransaction, secondTransaction) =>
        secondTransaction.date.getTime() - firstTransaction.date.getTime(),
    );
}

export function getMonthlyChartData(transactions: Transaction[]) {
  const totalsByMonth = new Map<string, { income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const monthKey = getMonthKey(transaction.date);

    const currentTotals = totalsByMonth.get(monthKey) ?? {
      income: 0,
      expense: 0,
    };

    if (transaction.type === "income") {
      currentTotals.income += transaction.amount;
    } else {
      currentTotals.expense += transaction.amount;
    }

    totalsByMonth.set(monthKey, currentTotals);
  });

  return Array.from(totalsByMonth.entries())
    .sort(([firstMonth], [secondMonth]) =>
      firstMonth.localeCompare(secondMonth),
    )
    .map(([monthKey, totals]) => ({
      monthKey,
      monthLabel: getMonthLabel(monthKey),
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    }));
}

export function getCategoryExpenseData(
  transactions: Transaction[],
  categories: Category[],
) {
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const categoryBudgets = new Map(
    categories.map((category) => [category.id, category.maxBudget]),
  );
  const totalsByCategory = new Map<
    string,
    {
      amount: number;
      budget: number | null;
    }
  >();

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const categoryName = transaction.categoryId
        ? (categoryNames.get(transaction.categoryId) ?? "Onbekende categorie")
        : "Geen categorie";
      const budget = transaction.categoryId
        ? (categoryBudgets.get(transaction.categoryId) ?? null)
        : null;

      const currentTotal = totalsByCategory.get(categoryName) ?? {
        amount: 0,
        budget,
      };

      totalsByCategory.set(categoryName, {
        amount: currentTotal.amount + transaction.amount,
        budget,
      });
    });

  return Array.from(totalsByCategory.entries())
    .map(([categoryName, data]) => ({
      categoryName,
      amount: data.amount,
      budget: data.budget,
    }))
    .sort((firstCategory, secondCategory) => {
      return secondCategory.amount - firstCategory.amount;
    });
}

function getTransactionTotals(transactions: Transaction[]) {
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
  };
}

export function getFinancialSummaryCards(transactions: Transaction[]) {
  const { incomeTotal, expenseTotal, balance } =
    getTransactionTotals(transactions);

  return [
    {
      label: "Inkomsten",
      value: formatCurrency(incomeTotal),
      accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Uitgaven",
      value: formatCurrency(expenseTotal),
      accentClassName: "border-rose-200 bg-rose-50 text-rose-900",
    },
    {
      label: "Saldo",
      value: formatCurrency(balance),
      accentClassName:
        balance >= 0
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : "border-amber-200 bg-amber-50 text-amber-900",
    },
  ];
}
