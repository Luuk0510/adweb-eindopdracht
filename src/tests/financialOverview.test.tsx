import { jest, test, expect, describe, beforeEach } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";

jest.mock("@/hooks/useAuthRedirect", () => ({
  useAuthRedirect: jest.fn(),
}));

jest.mock("@/hooks/useFinancialData", () => ({
  useFinancialData: jest.fn(),
}));

jest.mock("@/hooks/useTransactionForm", () => ({
  useTransactionForm: jest.fn(),
}));

const { FinancialOverview } = jest.requireActual(
  "@/components/household-books/detail/FinancialOverview",
) as typeof import("@/components/household-books/detail/FinancialOverview");
const { useAuthRedirect } = jest.requireMock(
  "@/hooks/useAuthRedirect",
) as typeof import("@/hooks/useAuthRedirect");
const { useFinancialData } = jest.requireMock(
  "@/hooks/useFinancialData",
) as typeof import("@/hooks/useFinancialData");
const { useTransactionForm } = jest.requireMock(
  "@/hooks/useTransactionForm",
) as typeof import("@/hooks/useTransactionForm");

const mockedUseAuthRedirect = useAuthRedirect as jest.MockedFunction<
  typeof useAuthRedirect
>;
const mockedUseFinancialData = useFinancialData as jest.MockedFunction<
  typeof useFinancialData
>;
const mockedUseTransactionForm = useTransactionForm as jest.MockedFunction<
  typeof useTransactionForm
>;

const category: Category = {
  id: "category-1",
  bookId: "book-1",
  name: "Boodschappen",
  maxBudget: 200,
  endDate: null,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

const transaction: Transaction = {
  id: "transaction-1",
  bookId: "book-1",
  categoryId: "category-1",
  type: "expense",
  title: "Boodschappen",
  amount: 25,
  date: new Date("2026-06-03"),
  createdBy: "user-1",
  createdAt: new Date("2026-06-03"),
  updatedAt: new Date("2026-06-03"),
};

function renderFinancialOverview(canManage = true) {
  return render(
    <FinancialOverview
      bookId="book-1"
      title="Overzicht van Prive"
      description="Prive uitgaven"
      categoryOverviewHref="/household-books/book-1/categories"
      canManage={canManage}
    />,
  );
}

function mockFinancialData(overrides = {}) {
  mockedUseFinancialData.mockReturnValue({
    transactions: [transaction],
    setTransactions: jest.fn(),
    categories: [category],
    selectedMonth: "2026-06",
    setSelectedMonth: jest.fn(),
    isLoading: false,
    errorMessage: "",
    availableMonths: ["2026-06", "2026-05"],
    monthlyChartData: [
      {
        monthKey: "2026-06",
        monthLabel: "juni 2026",
        income: 1000,
        expense: 25,
        balance: 975,
      },
    ],
    effectiveMonth: "2026-06",
    monthlyTransactions: [transaction],
    categoryExpenseData: [
      {
        categoryName: "Boodschappen",
        amount: 25,
      },
    ],
    summaryCards: [
      {
        label: "Inkomsten",
        value: "EUR 1000",
        helper: "98% van alle bewegingen",
        accentClassName: "test-class",
      },
      {
        label: "Uitgaven",
        value: "EUR 25",
        helper: "2% van alle bewegingen",
        accentClassName: "test-class",
      },
    ],
    refreshTransactions: jest.fn(async () => undefined),
    ...overrides,
  });
}

function mockTransactionForm(overrides = {}) {
  mockedUseTransactionForm.mockReturnValue({
    transactionTitle: "",
    transactionAmount: "",
    transactionType: "expense",
    transactionCategoryId: "",
    transactionDate: "2026-06-03",
    editingTransactionId: null,
    transactionErrorMessage: "",
    setTransactionTitle: jest.fn(),
    setTransactionAmount: jest.fn(),
    setTransactionType: jest.fn(),
    setTransactionCategoryId: jest.fn(),
    setTransactionDate: jest.fn(),
    resetTransactionForm: jest.fn(),
    handleTransactionSubmit: jest.fn((event: React.SubmitEvent<HTMLFormElement>) =>
      event.preventDefault(),
    ),
    startEditingTransaction: jest.fn(),
    handleDeleteTransaction: jest.fn(),
    handleDropTransactionOnCategory: jest.fn(),
    ...overrides,
  });
}

describe("FinancialOverview", () => {
  beforeEach(() => {
    mockedUseAuthRedirect.mockReturnValue({
      user: { uid: "user-1" } as never,
      isCheckingAuth: false,
    });
    mockFinancialData();
    mockTransactionForm();
  });

  test("toont laadstatus", () => {
    // Arrange
    mockedUseAuthRedirect.mockReturnValue({
      user: null,
      isCheckingAuth: true,
    });

    // Act
    renderFinancialOverview();

    // Assert
    expect(screen.getByText("Overzicht laden...")).toBeTruthy();
  });

  test("toont foutmelding als overzicht niet beschikbaar is", () => {
    // Arrange
    mockFinancialData({
      errorMessage: "Geen toegang.",
    });

    // Act
    renderFinancialOverview();

    // Assert
    expect(screen.getByText("Overzicht niet beschikbaar")).toBeTruthy();
    expect(screen.getByText("Geen toegang.")).toBeTruthy();
  });

  test("happy flow: toont overzicht en maandfilter", () => {
    // Arrange
    const setSelectedMonth = jest.fn();
    mockFinancialData({
      setSelectedMonth,
    });

    // Act
    renderFinancialOverview();
    fireEvent.change(screen.getByLabelText("Bekijk per maand"), {
      target: { value: "2026-05" },
    });

    // Assert
    expect(screen.getByText("Overzicht van Prive")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Categorie overzicht" }))
      .toHaveAttribute("href", "/household-books/book-1/categories");
    expect(setSelectedMonth).toHaveBeenCalledWith("2026-05");
    expect(screen.getByText("Nieuwe transactie")).toBeTruthy();
    expect(screen.getByText("Sleep naar categorie")).toBeTruthy();
  });

  test("bad flow: deelnemer ziet geen beheerformulier", () => {
    // Arrange

    // Act
    renderFinancialOverview(false);

    // Assert
    expect(screen.getByText("Overzicht van Prive")).toBeTruthy();
    expect(screen.queryByText("Nieuwe transactie")).toBeNull();
    expect(screen.queryByText("Sleep naar categorie")).toBeNull();
  });
});
