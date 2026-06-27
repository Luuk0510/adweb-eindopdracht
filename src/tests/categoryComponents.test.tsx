import { jest, test, expect, describe } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryCard } from "@/components/household-books/categories/CategoryCard";
import { CategoryForm } from "@/components/household-books/categories/CategoryForm";
import { CategoryList } from "@/components/household-books/categories/CategoryList";
import { Category } from "@/types/category";
import { CategoryOverview } from "@/utils/categoryCalculations";

const category: Category = {
  id: "category-1",
  bookId: "book-1",
  name: "Boodschappen",
  maxBudget: 200,
  endDate: new Date("2026-06-30"),
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
};

const safeOverview: CategoryOverview = {
  id: "category-1",
  name: "Boodschappen",
  budget: 200,
  endDate: new Date("2026-06-30"),
  spent: 50,
  remaining: 150,
  usagePercent: 25,
  status: "safe",
};

const warningOverview: CategoryOverview = {
  ...safeOverview,
  id: "category-2",
  name: "Uitgaan",
  spent: 90,
  remaining: 10,
  usagePercent: 90,
  status: "warning",
};

const dangerOverview: CategoryOverview = {
  ...safeOverview,
  id: "category-3",
  name: "Vakantie",
  spent: 250,
  remaining: -50,
  usagePercent: 125,
  status: "danger",
};

function renderCategoryForm(overrides = {}) {
  return render(
    <CategoryForm
      categoryName=""
      maxBudgetInput=""
      endDateInput=""
      editingCategoryId={null}
      formMessage=""
      isSubmitting={false}
      onCategoryNameChange={jest.fn()}
      onMaxBudgetChange={jest.fn()}
      onEndDateChange={jest.fn()}
      onSubmitAction={jest.fn((event: React.SubmitEvent<HTMLFormElement>) =>
        event.preventDefault(),
      )}
      onCancelAction={jest.fn()}
      {...overrides}
    />,
  );
}

describe("CategoryCard", () => {
  test("toont budgetinformatie en beheerknoppen", async () => {
    // Arrange
    const user = userEvent.setup();
    const onEditAction = jest.fn();
    const onDeleteAction = jest.fn();

    render(
      <CategoryCard
        category={safeOverview}
        canManageCategories={true}
        isSubmitting={false}
        onEditAction={onEditAction}
        onDeleteAction={onDeleteAction}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));

    // Assert
    expect(screen.getByText("Boodschappen")).toBeTruthy();
    expect(screen.getByText("Binnen budget")).toBeTruthy();
    expect(screen.getByText("25% van budget gebruikt")).toBeTruthy();
    expect(onEditAction).toHaveBeenCalledTimes(1);
    expect(onDeleteAction).toHaveBeenCalledTimes(1);
  });

  test("toont waarschuwing en gevaar status", () => {
    // Arrange
    render(
      <>
        <CategoryCard
          category={warningOverview}
          canManageCategories={false}
          isSubmitting={false}
          onEditAction={jest.fn()}
          onDeleteAction={jest.fn()}
        />
        <CategoryCard
          category={dangerOverview}
          canManageCategories={false}
          isSubmitting={false}
          onEditAction={jest.fn()}
          onDeleteAction={jest.fn()}
        />
      </>,
    );

    // Act

    // Assert
    expect(screen.getByText("Budget bijna op")).toBeTruthy();
    expect(screen.getByText("Over budget")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Aanpassen" })).toBeNull();
  });
});

describe("CategoryForm", () => {
  test("happy flow: vult formulier in en submit", () => {
    // Arrange
    const onCategoryNameChange = jest.fn();
    const onMaxBudgetChange = jest.fn();
    const onEndDateChange = jest.fn();
    const onSubmitAction = jest.fn((event: React.SubmitEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );

    renderCategoryForm({
      onCategoryNameChange,
      onMaxBudgetChange,
      onEndDateChange,
      onSubmitAction,
    });

    // Act
    fireEvent.change(screen.getByLabelText("Naam"), {
      target: { value: "Huur" },
    });
    fireEvent.change(screen.getByLabelText("Maximaal budget"), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByLabelText("Einddatum (optioneel)"), {
      target: { value: "2026-06-30" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Toevoegen" }));

    // Assert
    expect(onCategoryNameChange).toHaveBeenCalledWith("Huur");
    expect(onMaxBudgetChange).toHaveBeenCalledWith("1000");
    expect(onEndDateChange).toHaveBeenCalledWith("2026-06-30");
    expect(onSubmitAction).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Naam").getAttribute("maxlength")).toBe("50");
  });

  test("edit flow: toont melding en annuleren", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancelAction = jest.fn();

    renderCategoryForm({
      editingCategoryId: "category-1",
      categoryName: "Boodschappen",
      maxBudgetInput: "200",
      formMessage: "Categorie bijgewerkt.",
      onCancelAction,
    });

    // Act
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    // Assert
    expect(screen.getByText("Categorie aanpassen")).toBeTruthy();
    expect(screen.getByText("Categorie bijgewerkt.")).toBeTruthy();
    expect(onCancelAction).toHaveBeenCalledTimes(1);
  });
});

describe("CategoryList", () => {
  test("bad flow: toont lege staat", () => {
    // Arrange
    render(
      <CategoryList
        categoryOverviews={[]}
        categories={[]}
        canManageCategories={true}
        isSubmitting={false}
        onEditAction={jest.fn()}
        onDeleteAction={jest.fn()}
      />,
    );

    // Act

    // Assert
    expect(screen.getByText("Nog geen categorieen")).toBeTruthy();
  });

  test("happy flow: roept aanpassen en verwijderen aan", async () => {
    // Arrange
    const user = userEvent.setup();
    const onEditAction = jest.fn();
    const onDeleteAction = jest.fn();

    render(
      <CategoryList
        categoryOverviews={[safeOverview]}
        categories={[category]}
        canManageCategories={true}
        isSubmitting={false}
        onEditAction={onEditAction}
        onDeleteAction={onDeleteAction}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));

    // Assert
    expect(onEditAction).toHaveBeenCalledWith(category);
    expect(onDeleteAction).toHaveBeenCalledWith("category-1");
  });
});
