import { describe, expect, test } from "@jest/globals";
import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";
import {
  getAvailableMonths,
  getCategoryExpenseData,
  getFinancialSummaryCards,
  getMonthKey,
  getMonthlyChartData,
  getMonthlyTransactions,
} from "@/utils/financialCalculations";
import { getCategoryOverviews } from "@/utils/categoryCalculations";

const category: Category = {
  id: "cat-1",
  bookId: "book-1",
  name: "Boodschappen",
  maxBudget: 100,
  endDate: null,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

const transactions: Transaction[] = [
  {
    id: "transaction-1",
    bookId: "book-1",
    categoryId: "cat-1",
    type: "expense",
    title: "Supermarkt",
    amount: 75,
    date: new Date("2026-06-03"),
    createdBy: "user-1",
    createdAt: new Date("2026-06-03"),
    updatedAt: new Date("2026-06-03"),
  },
  {
    id: "transaction-2",
    bookId: "book-1",
    categoryId: null,
    type: "income",
    title: "Loon",
    amount: 1000,
    date: new Date("2026-05-20"),
    createdBy: "user-1",
    createdAt: new Date("2026-05-20"),
    updatedAt: new Date("2026-05-20"),
  },
  {
    id: "transaction-3",
    bookId: "book-1",
    categoryId: "cat-1",
    type: "expense",
    title: "Extra boodschappen",
    amount: 50,
    date: new Date("2026-06-05"),
    createdBy: "user-1",
    createdAt: new Date("2026-06-05"),
    updatedAt: new Date("2026-06-05"),
  },
];

describe("financial calculations", () => {
  test("maakt maand keys en sorteert beschikbare maanden", () => {
    expect(getMonthKey(new Date("2026-06-03"))).toBe("2026-06");
    expect(getAvailableMonths(transactions)).toEqual(["2026-06", "2026-05"]);
  });

  test("filtert transacties per maand en zet nieuwste eerst", () => {
    const monthlyTransactions = getMonthlyTransactions(
      transactions,
      "2026-06",
    );

    expect(monthlyTransactions.map((transaction) => transaction.id)).toEqual([
      "transaction-3",
      "transaction-1",
    ]);
  });

  test("maakt grafiekdata en samenvatting voor inkomsten en uitgaven", () => {
    const chartData = getMonthlyChartData(transactions);
    const summaryCards = getFinancialSummaryCards(transactions);

    expect(chartData).toEqual([
      expect.objectContaining({
        monthKey: "2026-05",
        income: 1000,
        expense: 0,
      }),
      expect.objectContaining({
        monthKey: "2026-06",
        income: 0,
        expense: 125,
      }),
    ]);
    expect(summaryCards.map((card) => card.label)).toEqual([
      "Inkomsten",
      "Uitgaven",
      "Saldo",
    ]);
  });

  test("berekent uitgaven per categorie en budgetstatus", () => {
    const categoryExpenseData = getCategoryExpenseData(transactions, [category]);
    const categoryOverviews = getCategoryOverviews([category], transactions);

    expect(categoryExpenseData).toEqual([
      {
        categoryName: "Boodschappen",
        amount: 125,
        budget: 100,
      },
    ]);
    expect(categoryOverviews[0]).toEqual(
      expect.objectContaining({
        spent: 125,
        remaining: -25,
        status: "danger",
      }),
    );
  });
});
