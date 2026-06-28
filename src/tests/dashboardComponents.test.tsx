import { jest, describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchivedHouseholdBookList } from "@/components/household-books/dashboard/ArchivedHouseholdBookList";
import { HouseholdBookForm } from "@/components/household-books/dashboard/HouseholdBookForm";
import { HouseholdBookList } from "@/components/household-books/dashboard/HouseholdBookList";
import { HouseholdBook } from "@/types/householdBook";

const book: HouseholdBook = {
  id: "book-1",
  name: "Privé huishoudboekje",
  description: "Privé uitgaven",
  ownerId: "user-1",
  participantIds: [],
  participantEmails: {},
  isArchived: false,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

describe("dashboard components", () => {
  test("HouseholdBookForm verstuurt naam en omschrijving", async () => {
    const user = userEvent.setup();
    const onNameChange = jest.fn();
    const onDescriptionChange = jest.fn();
    const onSubmit = jest.fn((event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    render(
      <HouseholdBookForm
        name=""
        description=""
        editingBookId={null}
        errorMessage=""
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Naam *"), "Vakantie");
    await user.type(screen.getByLabelText("Omschrijving"), "Spanje");
    fireEvent.submit(screen.getByRole("button", { name: "Toevoegen" }));

    expect(onNameChange).toHaveBeenCalled();
    expect(onDescriptionChange).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    expect(screen.getByLabelText("Naam *")).toHaveAttribute("maxLength", "50");
  });

  test("HouseholdBookList toont lege, loading en gevulde states", async () => {
    const user = userEvent.setup();
    const onEditAction = jest.fn();
    const onArchiveAction = jest.fn();

    const { rerender } = render(
      <HouseholdBookList
        books={[]}
        isLoading
        currentUserId="user-1"
        onEditAction={onEditAction}
        onArchiveAction={onArchiveAction}
      />,
    );

    expect(screen.getByText("Huishoudboekjes laden...")).toBeInTheDocument();

    rerender(
      <HouseholdBookList
        books={[]}
        isLoading={false}
        currentUserId="user-1"
        onEditAction={onEditAction}
        onArchiveAction={onArchiveAction}
      />,
    );

    expect(screen.getByText("Nog geen huishoudboekjes")).toBeInTheDocument();

    rerender(
      <HouseholdBookList
        books={[book]}
        isLoading={false}
        currentUserId="user-1"
        onEditAction={onEditAction}
        onArchiveAction={onArchiveAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));

    expect(screen.getByText("Privé huishoudboekje")).toBeInTheDocument();
    expect(onEditAction).toHaveBeenCalledWith(
      "book-1",
      "Privé huishoudboekje",
      "Privé uitgaven",
    );
    expect(onArchiveAction).toHaveBeenCalledWith("book-1");
  });

  test("gedeeld boekje toont geen eigenaar-knoppen", () => {
    render(
      <HouseholdBookList
        books={[{ ...book, ownerId: "user-2" }]}
        isLoading={false}
        currentUserId="user-1"
        onEditAction={jest.fn()}
        onArchiveAction={jest.fn()}
      />,
    );

    expect(screen.getByText("Privé huishoudboekje")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aanpassen" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Deelnemers" })).toBeNull();
  });

  test("ArchivedHouseholdBookList kan herstellen", async () => {
    const user = userEvent.setup();
    const onRestoreAction = jest.fn();

    render(
      <ArchivedHouseholdBookList
        archivedBooks={[book]}
        onRestoreAction={onRestoreAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Herstellen" }));

    expect(onRestoreAction).toHaveBeenCalledWith("book-1");
  });
});
