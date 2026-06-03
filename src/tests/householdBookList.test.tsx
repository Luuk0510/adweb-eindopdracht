import { jest, test, expect, describe } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdBookList } from "@/components/household-books/HouseholdBookList";
import { HouseholdBook } from "@/types/householdBook";

const baseBook: HouseholdBook = {
  id: "book-1",
  name: "Prive huishoudboekje",
  description: "Voor prive uitgaven",
  ownerId: "user-1",
  participantIds: [],
  isArchived: false,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

describe("HouseholdBookList", () => {
  test("toont een laadstatus", () => {
    render(
      <HouseholdBookList
        books={[]}
        isLoading={true}
        currentUserId="user-1"
        onEditAction={jest.fn()}
        onArchiveAction={jest.fn()}
      />,
    );

    expect(screen.getByText("Huishoudboekjes laden...")).toBeTruthy();
  });

  test("toont een lege staat als er geen boekjes zijn", () => {
    render(
      <HouseholdBookList
        books={[]}
        isLoading={false}
        currentUserId="user-1"
        onEditAction={jest.fn()}
        onArchiveAction={jest.fn()}
      />,
    );

    expect(screen.getByText("Nog geen huishoudboekjes")).toBeTruthy();
  });

  test("happy flow: eigenaar kan aanpassen en archiveren", async () => {
    const user = userEvent.setup();
    const onEditAction = jest.fn();
    const onArchiveAction = jest.fn();

    render(
      <HouseholdBookList
        books={[baseBook]}
        isLoading={false}
        currentUserId="user-1"
        onEditAction={onEditAction}
        onArchiveAction={onArchiveAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));

    expect(onEditAction).toHaveBeenCalledWith(
      "book-1",
      "Prive huishoudboekje",
      "Voor prive uitgaven",
    );
    expect(onArchiveAction).toHaveBeenCalledWith("book-1");
    expect(screen.getByRole("link", { name: "Bekijken" }).getAttribute("href"))
      .toBe("/household-books/book-1");
  });

  test("bad flow: deelnemer ziet geen eigenaar-acties", () => {
    render(
      <HouseholdBookList
        books={[baseBook]}
        isLoading={false}
        currentUserId="user-2"
        onEditAction={jest.fn()}
        onArchiveAction={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Aanpassen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Archiveren" })).toBeNull();
    expect(screen.getByRole("link", { name: "Bekijken" })).toBeTruthy();
  });
});
