import { jest, describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdBookNotAvailable } from "@/components/household-books/feedback/HouseholdBookNotAvailable";
import { HouseholdBookSkeleton } from "@/components/household-books/feedback/HouseholdBookSkeleton";
import { CategoryExpenseBarChart } from "@/components/household-books/detail/CategoryExpenseBarChart";
import { FinancialSummaryCards } from "@/components/household-books/detail/FinancialSummaryCards";
import { MonthlyBalanceChart } from "@/components/household-books/detail/MonthlyBalanceChart";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton, PrimaryLink } from "@/components/ui/PrimaryButton";
import {
  SecondaryButton,
  SecondaryLink,
} from "@/components/ui/SecondaryButton";

describe("ui and chart components", () => {
  test("buttons en links renderen met juiste tekst", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <div>
        <PrimaryButton onClick={onClick}>Opslaan</PrimaryButton>
        <PrimaryLink href="/login">Inloggen</PrimaryLink>
        <SecondaryButton variant="danger">Verwijderen</SecondaryButton>
        <SecondaryLink href="/dashboard">Dashboard</SecondaryLink>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Inloggen" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  test("Modal sluit via achtergrond maar niet via inhoud", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal onClose={onClose}>
        <button type="button">Binnenkant</button>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Binnenkant" }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByText("Binnenkant").parentElement!.parentElement!);
    expect(onClose).toHaveBeenCalled();
  });

  test("feedback componenten tonen tekst", () => {
    const { rerender } = render(<HouseholdBookSkeleton />);

    expect(document.querySelector(".bg-gray-200")).not.toBeNull();

    rerender(
      <HouseholdBookNotAvailable
        title="Niet beschikbaar"
        message="Je hebt geen toegang."
      />,
    );

    expect(screen.getByText("Niet beschikbaar")).toBeInTheDocument();
    expect(screen.getByText("Je hebt geen toegang.")).toBeInTheDocument();
  });

  test("MonthlyBalanceChart toont lege state en chart state", () => {
    const { rerender } = render(
      <MonthlyBalanceChart
        monthlyChartData={[]}
        formatCurrency={(amount) => `€ ${amount}`}
      />,
    );

    expect(
      screen.getByText("De grafiek verschijnt zodra er transacties zijn."),
    ).toBeInTheDocument();

    rerender(
      <MonthlyBalanceChart
        monthlyChartData={[
          {
            monthKey: "2026-06",
            monthLabel: "juni 2026",
            income: 1000,
            expense: 50,
            balance: 950,
          },
        ]}
        formatCurrency={(amount) => `€ ${amount}`}
      />,
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  test("CategoryExpenseBarChart toont lege state en chart state", () => {
    const { rerender } = render(
      <CategoryExpenseBarChart
        categoryExpenseData={[]}
        formatCurrency={(amount) => `€ ${amount}`}
      />,
    );

    expect(
      screen.getByText("De staafdiagram verschijnt zodra er uitgaven zijn."),
    ).toBeInTheDocument();

    rerender(
      <CategoryExpenseBarChart
        categoryExpenseData={[
          {
            categoryName: "Boodschappen",
            amount: 75,
            budget: 100,
          },
        ]}
        formatCurrency={(amount) => `€ ${amount}`}
      />,
    );

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  test("FinancialSummaryCards toont alle kaarten", () => {
    render(
      <FinancialSummaryCards
        cards={[
          {
            label: "Inkomsten",
            value: "€ 100,00",
            accentClassName: "text-green-700",
          },
          {
            label: "Uitgaven",
            value: "€ 50,00",
            accentClassName: "text-red-700",
          },
        ]}
      />,
    );

    expect(screen.getByText("Inkomsten")).toBeInTheDocument();
    expect(screen.getByText("€ 100,00")).toBeInTheDocument();
    expect(screen.getByText("Uitgaven")).toBeInTheDocument();
  });
});
