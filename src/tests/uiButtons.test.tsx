import { jest, test, expect, describe } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  SecondaryButton,
  SecondaryLink,
} from "@/components/ui/SecondaryButton";

describe("UI buttons", () => {
  test("primary button gebruikt hover/cursor styling en voert click uit", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<PrimaryButton onClick={onClick}>Opslaan</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Opslaan" });

    // Act
    expect(button.className).toContain("cursor-pointer");
    expect(button.className).toContain("hover:bg-gray-800");

    await user.click(button);

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("secondary danger button gebruikt rode styling", () => {
    // Arrange
    render(<SecondaryButton variant="danger">Verwijderen</SecondaryButton>);

    const button = screen.getByRole("button", { name: "Verwijderen" });

    // Act

    // Assert
    expect(button.className).toContain("cursor-pointer");
    expect(button.className).toContain("text-red-700");
    expect(button.className).toContain("hover:bg-red-50");
  });

  test("secondary link rendert als navigatieknop", () => {
    // Arrange
    render(<SecondaryLink href="/dashboard">Dashboard</SecondaryLink>);

    const link = screen.getByRole("link", { name: "Dashboard" });

    // Act

    // Assert
    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(link.className).toContain("cursor-pointer");
  });
});
