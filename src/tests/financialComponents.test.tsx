import { jest, test, expect, describe } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchivedHouseholdBookList } from "@/components/household-books/dashboard/ArchivedHouseholdBookList";
import { CategoryExpenseBarChart } from "@/components/household-books/detail/CategoryExpenseBarChart";
import { FinancialSummaryCards } from "@/components/household-books/detail/FinancialSummaryCards";
import { HouseholdBookNotAvailable } from "@/components/household-books/feedback/HouseholdBookNotAvailable";
import { HouseholdBookSkeleton } from "@/components/household-books/feedback/HouseholdBookSkeleton";
import { MonthlyBalanceChart } from "@/components/household-books/detail/MonthlyBalanceChart";
import { HouseholdBook } from "@/types/householdBook";

const archivedBook: HouseholdBook = {
  id: "book-archive",
  name: "Oud boekje",
  description: "",
  ownerId: "user-1",
  participantIds: [],
  isArchived: true,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

describe("FinancialSummaryCards", () => {
  test("toont alle statistiekkaarten", () => {
    // Arrange
    render(
      <FinancialSummaryCards
        cards={[
          {
            label: "Inkomsten",
            value: "EUR 100",
            accentClassName: "test-class",
          },
          {
            label: "Uitgaven",
            value: "EUR 50",
            accentClassName: "test-class",
          },
        ]}
      />,
    );

    // Act

    // Assert
    expect(screen.getByText("Inkomsten")).toBeTruthy();
    expect(screen.getByText("EUR 100")).toBeTruthy();
    expect(screen.getByText("Uitgaven")).toBeTruthy();
  });
});

describe("MonthlyBalanceChart", () => {
  test("bad flow: toont lege staat zonder data", () => {
    // Arrange
    render(
      <MonthlyBalanceChart
        monthlyChartData={[]}
        formatCurrency={(amount) => `EUR ${amount}`}
      />,
    );

    // Act

    // Assert
    expect(
      screen.getByText("De grafiek verschijnt zodra er transacties zijn."),
    ).toBeTruthy();
  });

  test("happy flow: toont grafiek met data", () => {
    // Arrange
    render(
      <MonthlyBalanceChart
        monthlyChartData={[
          {
            monthKey: "2026-06",
            monthLabel: "juni 2026",
            income: 1000,
            expense: 250,
            balance: 750,
          },
        ]}
        formatCurrency={(amount) => `EUR ${amount}`}
      />,
    );

    // Act

    // Assert
    expect(screen.getByTestId("line-chart")).toBeTruthy();
    expect(screen.getByText("Inkomsten")).toBeTruthy();
    expect(screen.getByText("Uitgaven")).toBeTruthy();
  });
});

describe("CategoryExpenseBarChart", () => {
  test("bad flow: toont lege staat zonder categorie-uitgaven", () => {
    // Arrange
    render(
      <CategoryExpenseBarChart
        categoryExpenseData={[]}
        formatCurrency={(amount) => `EUR ${amount}`}
      />,
    );

    // Act

    // Assert
    expect(screen.getByText("Uitgaven per categorie")).toBeTruthy();
    expect(
      screen.getByText("De staafdiagram verschijnt zodra er uitgaven zijn."),
    ).toBeTruthy();
  });

  test("happy flow: toont staafdiagram met categorie-uitgaven", () => {
    // Arrange
    render(
      <CategoryExpenseBarChart
        categoryExpenseData={[
          {
            categoryName: "Boodschappen",
            amount: 125,
            budget: 200,
          },
          {
            categoryName: "Huur",
            amount: 900,
            budget: 800,
          },
        ]}
        formatCurrency={(amount) => `EUR ${amount}`}
      />,
    );

    // Act

    // Assert
    expect(screen.getByTestId("bar-chart")).toBeTruthy();
    expect(screen.getByText("Uitgaven")).toBeTruthy();
    expect(
      screen.queryByText("De staafdiagram verschijnt zodra er uitgaven zijn."),
    ).toBeNull();
  });
});

describe("ArchivedHouseholdBookList", () => {
  test("bad flow: toont lege archieflijst", () => {
    // Arrange
    render(
      <ArchivedHouseholdBookList
        archivedBooks={[]}
        onRestoreAction={jest.fn()}
      />,
    );

    // Act

    // Assert
    expect(
      screen.getByText("Er zijn geen gearchiveerde huishoudboekjes."),
    ).toBeTruthy();
  });

  test("happy flow: herstellen roept callback aan", async () => {
    // Arrange
    const user = userEvent.setup();
    const onRestoreAction = jest.fn();

    render(
      <ArchivedHouseholdBookList
        archivedBooks={[archivedBook]}
        onRestoreAction={onRestoreAction}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Herstellen" }));

    // Assert
    expect(onRestoreAction).toHaveBeenCalledWith("book-archive");
  });
});

describe("HouseholdBook feedback components", () => {
  test("toont niet beschikbaar melding", () => {
    // Arrange
    render(
      <HouseholdBookNotAvailable
        title="Niet gevonden"
        message="Geen toegang"
      />,
    );

    // Act

    // Assert
    expect(screen.getByText("Niet gevonden")).toBeTruthy();
    expect(screen.getByText("Geen toegang")).toBeTruthy();
  });

  test("toont skeleton", () => {
    // Arrange
    const { container } = render(<HouseholdBookSkeleton />);

    // Act

    // Assert
    expect(container.querySelector("main")).toBeTruthy();
  });
});
