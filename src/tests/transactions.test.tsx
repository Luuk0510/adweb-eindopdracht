import { jest, test, expect, describe } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "@/components/household-books/TransactionForm";
import { TransactionList } from "@/components/household-books/TransactionList";
import { Transaction } from "@/types/transaction";

const expenseTransaction: Transaction = {
  id: "transaction-1",
  bookId: "book-1",
  categoryId: null,
  type: "expense",
  title: "Boodschappen",
  amount: 25,
  date: new Date("2026-06-03"),
  createdBy: "user-1",
  createdAt: new Date("2026-06-03"),
  updatedAt: new Date("2026-06-03"),
};

function renderTransactionForm(overrides = {}) {
  return render(
    <TransactionForm
      title=""
      amount=""
      type="expense"
      date="2026-06-03"
      editingTransactionId={null}
      errorMessage=""
      onTitleChange={jest.fn()}
      onAmountChange={jest.fn()}
      onTypeChange={jest.fn()}
      onDateChange={jest.fn()}
      onSubmitAction={jest.fn()}
      onCancelAction={jest.fn()}
      {...overrides}
    />,
  );
}

describe("TransactionForm", () => {
  test("happy flow: geeft wijzigingen en submit door", () => {
    // Arrange
    const onTitleChange = jest.fn();
    const onAmountChange = jest.fn();
    const onTypeChange = jest.fn();
    const onDateChange = jest.fn();
    const onSubmitAction = jest.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );

    renderTransactionForm({
      onTitleChange,
      onAmountChange,
      onTypeChange,
      onDateChange,
      onSubmitAction,
    });

    // Act
    fireEvent.change(screen.getByLabelText("Titel"), {
      target: { value: "Salaris" },
    });
    fireEvent.change(screen.getByLabelText("Kosten *"), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByLabelText("Soort"), {
      target: { value: "income" },
    });
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-06-04" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Toevoegen" }));

    // Assert
    expect(onTitleChange).toHaveBeenCalledWith("Salaris");
    expect(onAmountChange).toHaveBeenCalledWith("1000");
    expect(onTypeChange).toHaveBeenCalledWith("income");
    expect(onDateChange).toHaveBeenCalledWith("2026-06-04");
    expect(onSubmitAction).toHaveBeenCalledTimes(1);
  });

  test("bad flow: toont foutmelding", () => {
    // Arrange
    renderTransactionForm({
      errorMessage: "Vul minimaal de kosten in.",
    });

    // Act

    // Assert
    expect(screen.getByText("Vul minimaal de kosten in.")).toBeTruthy();
  });

  test("edit flow: toont annuleren en roept cancel aan", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancelAction = jest.fn();

    renderTransactionForm({
      title: "Boodschappen",
      amount: "25",
      editingTransactionId: "transaction-1",
      onCancelAction,
    });

    expect(screen.getByText("Transactie aanpassen")).toBeTruthy();

    // Act
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    // Assert
    expect(onCancelAction).toHaveBeenCalledTimes(1);
  });

  test("bad flow: titelveld accepteert maximaal 50 tekens", () => {
    // Arrange
    renderTransactionForm();

    // Act

    // Assert
    expect(screen.getByLabelText("Titel").getAttribute("maxlength")).toBe("50");
  });
});

describe("TransactionList", () => {
  test("toont lege staat zonder transacties", () => {
    // Arrange
    render(
      <TransactionList
        transactions={[]}
        effectiveMonth="2026-06"
        formatDate={(date) => date.toISOString()}
        formatCurrency={(amount) => `EUR ${amount}`}
        onEditAction={jest.fn()}
        onDeleteAction={jest.fn()}
      />,
    );

    // Act

    // Assert
    expect(
      screen.getByText("Er zijn nog geen transacties voor deze maand."),
    ).toBeTruthy();
  });

  test("happy flow: toont transactie en roept aanpassen aan", async () => {
    // Arrange
    const user = userEvent.setup();
    const onEditAction = jest.fn();

    render(
      <TransactionList
        transactions={[expenseTransaction]}
        effectiveMonth="2026-06"
        formatDate={() => "03 jun 2026"}
        formatCurrency={(amount) => `EUR ${amount}`}
        onEditAction={onEditAction}
        onDeleteAction={jest.fn()}
      />,
    );

    // Act
    expect(screen.getByText("Boodschappen")).toBeTruthy();
    expect(screen.getByText("-EUR 25")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Aanpassen" }));

    // Assert
    expect(onEditAction).toHaveBeenCalledWith(expenseTransaction);
  });

  test("bad flow: verwijderen vraagt eerst bevestiging en kan annuleren", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDeleteAction = jest.fn();

    render(
      <TransactionList
        transactions={[expenseTransaction]}
        effectiveMonth="2026-06"
        formatDate={() => "03 jun 2026"}
        formatCurrency={(amount) => `EUR ${amount}`}
        onEditAction={jest.fn()}
        onDeleteAction={onDeleteAction}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));

    // Assert
    expect(
      screen.getByText("Weet je zeker dat je deze transactie wilt verwijderen?"),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(onDeleteAction).not.toHaveBeenCalled();
    expect(screen.queryByText("Ja, verwijderen")).toBeNull();
  });

  test("happy flow: verwijderen na bevestiging", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDeleteAction = jest.fn();

    render(
      <TransactionList
        transactions={[expenseTransaction]}
        effectiveMonth="2026-06"
        formatDate={() => "03 jun 2026"}
        formatCurrency={(amount) => `EUR ${amount}`}
        onEditAction={jest.fn()}
        onDeleteAction={onDeleteAction}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));
    await user.click(screen.getByRole("button", { name: "Ja, verwijderen" }));

    // Assert
    expect(onDeleteAction).toHaveBeenCalledWith("transaction-1");
  });
});
