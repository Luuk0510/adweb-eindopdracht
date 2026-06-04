import { jest, test, expect, describe } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdBookForm } from "@/components/household-books/HouseholdBookForm";

function renderHouseholdBookForm(overrides = {}) {
  return render(
    <HouseholdBookForm
      name=""
      description=""
      editingBookId={null}
      errorMessage=""
      onNameChange={jest.fn()}
      onDescriptionChange={jest.fn()}
      onSubmit={jest.fn((event: React.FormEvent<HTMLFormElement>) =>
        event.preventDefault(),
      )}
      onCancel={jest.fn()}
      {...overrides}
    />,
  );
}

describe("HouseholdBookForm", () => {
  test("happy flow: nieuw huishoudboekje invullen en submitten", () => {
    // Arrange
    const onNameChange = jest.fn();
    const onDescriptionChange = jest.fn();
    const onSubmit = jest.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );

    renderHouseholdBookForm({
      onNameChange,
      onDescriptionChange,
      onSubmit,
    });

    // Act
    fireEvent.change(screen.getByLabelText("Naam *"), {
      target: { value: "Vakantie" },
    });
    fireEvent.change(screen.getByLabelText("Omschrijving"), {
      target: { value: "Uitgaven voor vakantie" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Toevoegen" }));

    // Assert
    expect(onNameChange).toHaveBeenCalledWith("Vakantie");
    expect(onDescriptionChange).toHaveBeenCalledWith("Uitgaven voor vakantie");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("bad flow: toont foutmelding", () => {
    // Arrange
    renderHouseholdBookForm({
      errorMessage: "Naam is verplicht.",
    });

    // Act

    // Assert
    expect(screen.getByText("Naam is verplicht.")).toBeTruthy();
  });

  test("edit flow: toont annuleren en roept cancel aan", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = jest.fn();

    renderHouseholdBookForm({
      name: "Bestaand boekje",
      editingBookId: "book-1",
      onCancel,
    });

    expect(screen.getByText("Huishoudboekje aanpassen")).toBeTruthy();

    // Act
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
