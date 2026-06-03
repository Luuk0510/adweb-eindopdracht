import { jest, test, expect, describe } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchivedHouseholdBookList } from "@/components/household-books/ArchivedHouseholdBookList";
import { FinancialHeader } from "@/components/household-books/FinancialHeader";
import { FinancialSummaryCards } from "@/components/household-books/FinancialSummaryCards";
import { HouseholdBookNotAvailable } from "@/components/household-books/HouseholdBookNotAvailable";
import { HouseholdBookSkeleton } from "@/components/household-books/HouseholdBookSkeleton";
import { MonthlyBalanceChart } from "@/components/household-books/MonthlyBalanceChart";
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

describe("FinancialHeader", () => {
  test("happy flow: maand wijzigen", () => {
    const onMonthChange = jest.fn();

    render(
      <FinancialHeader
        title="Overzicht"
        description="Bekijk je balans"
        effectiveMonth="2026-06"
        availableMonths={["2026-06", "2026-05"]}
        getMonthLabel={(month) => month}
        onMonthChange={onMonthChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Bekijk per maand"), {
      target: { value: "2026-05" },
    });

    expect(screen.getByText("Overzicht")).toBeTruthy();
    expect(onMonthChange).toHaveBeenCalledWith("2026-05");
  });

  test("bad flow: toont fallback maand als er geen maanden zijn", () => {
    render(
      <FinancialHeader
        title="Overzicht"
        description="Bekijk je balans"
        effectiveMonth="2026-06"
        availableMonths={[]}
        getMonthLabel={(month) => `Maand ${month}`}
        onMonthChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Maand 2026-06")).toBeTruthy();
  });
});

describe("FinancialSummaryCards", () => {
  test("toont alle statistiekkaarten", () => {
    render(
      <FinancialSummaryCards
        cards={[
          {
            label: "Inkomsten",
            value: "EUR 100",
            helper: "50%",
            accentClassName: "test-class",
          },
          {
            label: "Uitgaven",
            value: "EUR 50",
            helper: "25%",
            accentClassName: "test-class",
          },
        ]}
      />,
    );

    expect(screen.getByText("Inkomsten")).toBeTruthy();
    expect(screen.getByText("EUR 100")).toBeTruthy();
    expect(screen.getByText("Uitgaven")).toBeTruthy();
  });
});

describe("MonthlyBalanceChart", () => {
  test("bad flow: toont lege staat zonder data", () => {
    render(
      <MonthlyBalanceChart
        monthlyChartData={[]}
        formatCurrency={(amount) => `EUR ${amount}`}
      />,
    );

    expect(
      screen.getByText("De grafiek verschijnt zodra er transacties zijn."),
    ).toBeTruthy();
  });

  test("happy flow: toont grafiek met data", () => {
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

    expect(screen.getByTestId("line-chart")).toBeTruthy();
    expect(screen.getByText("Inkomsten")).toBeTruthy();
    expect(screen.getByText("Uitgaven")).toBeTruthy();
  });
});

describe("ArchivedHouseholdBookList", () => {
  test("bad flow: toont lege archieflijst", () => {
    render(
      <ArchivedHouseholdBookList
        archivedBooks={[]}
        onRestoreAction={jest.fn()}
      />,
    );

    expect(
      screen.getByText("Er zijn geen gearchiveerde huishoudboekjes."),
    ).toBeTruthy();
  });

  test("happy flow: herstellen roept callback aan", async () => {
    const user = userEvent.setup();
    const onRestoreAction = jest.fn();

    render(
      <ArchivedHouseholdBookList
        archivedBooks={[archivedBook]}
        onRestoreAction={onRestoreAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Herstellen" }));

    expect(onRestoreAction).toHaveBeenCalledWith("book-archive");
  });
});

describe("HouseholdBook feedback components", () => {
  test("toont niet beschikbaar melding", () => {
    render(
      <HouseholdBookNotAvailable
        title="Niet gevonden"
        message="Geen toegang"
      />,
    );

    expect(screen.getByText("Niet gevonden")).toBeTruthy();
    expect(screen.getByText("Geen toegang")).toBeTruthy();
  });

  test("toont skeleton", () => {
    const { container } = render(<HouseholdBookSkeleton />);

    expect(container.querySelector("main")).toBeTruthy();
  });
});
