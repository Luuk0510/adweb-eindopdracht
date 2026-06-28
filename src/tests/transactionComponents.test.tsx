import { jest, describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "@/components/household-books/detail/TransactionForm";
import { TransactionList } from "@/components/household-books/detail/TransactionList";
import { Category } from "@/types/category";
import { Transaction } from "@/types/transaction";

jest.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
}));

const category: Category = {
  id: "cat-1",
  bookId: "book-1",
  name: "Boodschappen",
  maxBudget: 100,
  endDate: null,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

const transaction: Transaction = {
  id: "transaction-1",
  bookId: "book-1",
  categoryId: "cat-1",
  type: "expense",
  title: "Supermarkt",
  amount: 25,
  date: new Date("2026-06-03"),
  createdBy: "user-1",
  createdAt: new Date("2026-06-03"),
  updatedAt: new Date("2026-06-03"),
};

describe("transaction components", () => {
  test("TransactionForm geeft invoer en submit door", async () => {
    const user = userEvent.setup();
    const onTitleChange = jest.fn();
    const onAmountChange = jest.fn();
    const onTypeChange = jest.fn();
    const onCategoryChange = jest.fn();
    const onDateChange = jest.fn();
    const onSubmitAction = jest.fn(
      (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
      },
    );

    render(
      <TransactionForm
        title=""
        amount=""
        type="expense"
        categoryId=""
        categories={[category]}
        date="2026-06-03"
        editingTransactionId={null}
        errorMessage=""
        onTitleChange={onTitleChange}
        onAmountChange={onAmountChange}
        onTypeChange={onTypeChange}
        onCategoryChange={onCategoryChange}
        onDateChange={onDateChange}
        onSubmitAction={onSubmitAction}
        onCancelAction={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Titel"), "Boodschappen");
    await user.type(screen.getByLabelText("Kosten *"), "25");
    await user.selectOptions(screen.getByLabelText("Soort"), "income");
    await user.selectOptions(screen.getByLabelText("Categorie"), "cat-1");
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-06-04" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Toevoegen" }));

    expect(onTitleChange).toHaveBeenCalled();
    expect(onAmountChange).toHaveBeenCalled();
    expect(onTypeChange).toHaveBeenCalledWith("income");
    expect(onCategoryChange).toHaveBeenCalledWith("cat-1");
    expect(onDateChange).toHaveBeenCalled();
    expect(onSubmitAction).toHaveBeenCalled();
  });

  test("TransactionList toont lege state", () => {
    render(
      <TransactionList
        transactions={[]}
        categories={[]}
        effectiveMonth="2026-06"
        formatDate={() => "03 jun 2026"}
        formatCurrency={(amount) => `€ ${amount}`}
        onEditAction={jest.fn()}
        onDeleteAction={jest.fn()}
      />,
    );

    expect(
      screen.getByText("Er zijn nog geen transacties voor deze maand."),
    ).toBeInTheDocument();
  });

  test("TransactionList kan aanpassen en verwijderen bevestigen", async () => {
    const user = userEvent.setup();
    const onEditAction = jest.fn();
    const onDeleteAction = jest.fn();

    render(
      <TransactionList
        transactions={[transaction]}
        categories={[category]}
        effectiveMonth="2026-06"
        formatDate={() => "03 jun 2026"}
        formatCurrency={(amount) => `€ ${amount}`}
        onEditAction={onEditAction}
        onDeleteAction={onDeleteAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));

    expect(onEditAction).toHaveBeenCalledWith(transaction);
    expect(
      screen.getByText("Weet je zeker dat je deze transactie wilt verwijderen?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ja, verwijderen" }));

    expect(onDeleteAction).toHaveBeenCalledWith("transaction-1");
  });

  test("TransactionList verbergt beheerknoppen voor deelnemers", () => {
    render(
      <TransactionList
        transactions={[transaction]}
        categories={[category]}
        effectiveMonth="2026-06"
        formatDate={() => "03 jun 2026"}
        formatCurrency={(amount) => `€ ${amount}`}
        canManage={false}
        onEditAction={jest.fn()}
        onDeleteAction={jest.fn()}
      />,
    );

    expect(screen.getByText("Supermarkt")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aanpassen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Verwijderen" })).toBeNull();
  });
});
