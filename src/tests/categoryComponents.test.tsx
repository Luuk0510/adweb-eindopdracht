import { jest, describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryForm } from "@/components/household-books/categories/CategoryForm";
import { CategoryList } from "@/components/household-books/categories/CategoryList";
import { Category } from "@/types/category";
import { CategoryOverview } from "@/utils/categoryCalculations";

const category: Category = {
  id: "cat-1",
  bookId: "book-1",
  name: "Boodschappen",
  maxBudget: 100,
  endDate: null,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

const overview: CategoryOverview = {
  id: "cat-1",
  name: "Boodschappen",
  budget: 100,
  endDate: null,
  spent: 80,
  remaining: 20,
  usagePercent: 80,
  status: "warning",
};

describe("category components", () => {
  test("CategoryForm geeft invoer en submit door", async () => {
    const user = userEvent.setup();
    const onCategoryNameChange = jest.fn();
    const onMaxBudgetChange = jest.fn();
    const onEndDateChange = jest.fn();
    const onSubmitAction = jest.fn(
      (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
      },
    );

    render(
      <CategoryForm
        categoryName=""
        maxBudgetInput=""
        endDateInput=""
        editingCategoryId={null}
        formMessage=""
        isSubmitting={false}
        onCategoryNameChange={onCategoryNameChange}
        onMaxBudgetChange={onMaxBudgetChange}
        onEndDateChange={onEndDateChange}
        onSubmitAction={onSubmitAction}
        onCancelAction={jest.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Naam"), "Huur");
    await user.type(screen.getByLabelText("Maximaal budget"), "900");
    fireEvent.change(screen.getByLabelText("Einddatum (optioneel)"), {
      target: { value: "2026-12-31" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Toevoegen" }));

    expect(onCategoryNameChange).toHaveBeenCalled();
    expect(onMaxBudgetChange).toHaveBeenCalled();
    expect(onEndDateChange).toHaveBeenCalled();
    expect(onSubmitAction).toHaveBeenCalled();
    expect(screen.getByLabelText("Naam")).toHaveAttribute("maxLength", "50");
  });

  test("CategoryList toont lege state", () => {
    render(
      <CategoryList
        categoryOverviews={[]}
        categories={[]}
        canManageCategories
        isSubmitting={false}
        onEditAction={jest.fn()}
        onDeleteAction={jest.fn()}
      />,
    );

    expect(screen.getByText("Nog geen categorieen")).toBeInTheDocument();
  });

  test("CategoryList toont budget en beheerknoppen voor eigenaar", async () => {
    const user = userEvent.setup();
    const onEditAction = jest.fn();
    const onDeleteAction = jest.fn();

    render(
      <CategoryList
        categoryOverviews={[overview]}
        categories={[category]}
        canManageCategories
        isSubmitting={false}
        onEditAction={onEditAction}
        onDeleteAction={onDeleteAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));

    expect(screen.getByText("Boodschappen")).toBeInTheDocument();
    expect(screen.getByText(/80% van budget gebruikt/)).toBeInTheDocument();
    expect(onEditAction).toHaveBeenCalledWith(category);
    expect(onDeleteAction).toHaveBeenCalledWith("cat-1");
  });

  test("CategoryList verbergt beheerknoppen voor deelnemers", () => {
    render(
      <CategoryList
        categoryOverviews={[overview]}
        categories={[category]}
        canManageCategories={false}
        isSubmitting={false}
        onEditAction={jest.fn()}
        onDeleteAction={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Aanpassen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Verwijderen" })).toBeNull();
  });
});
