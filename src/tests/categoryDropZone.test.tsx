import { jest, describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { CategoryDropZone } from "@/components/household-books/detail/CategoryDropZone";
import { Category } from "@/types/category";

jest.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    isOver: false,
    setNodeRef: jest.fn(),
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

describe("CategoryDropZone", () => {
  test("toont uitleg en lege categorie melding", () => {
    render(<CategoryDropZone categories={[]} />);

    expect(screen.getByText("Categorieën")).toBeInTheDocument();
    expect(screen.getByText("Geen categorie")).toBeInTheDocument();
    expect(
      screen.getByText("Maak eerst categorieën aan om transacties eraan te koppelen."),
    ).toBeInTheDocument();
  });

  test("toont categorie en budget", () => {
    render(<CategoryDropZone categories={[category]} />);

    expect(screen.getByText("Boodschappen")).toBeInTheDocument();
    expect(screen.getByText("€ 100,00")).toBeInTheDocument();
  });
});
