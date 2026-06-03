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
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<PrimaryButton onClick={onClick}>Opslaan</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Opslaan" });

    expect(button.className).toContain("cursor-pointer");
    expect(button.className).toContain("hover:bg-gray-800");

    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("secondary danger button gebruikt rode styling", () => {
    render(<SecondaryButton variant="danger">Verwijderen</SecondaryButton>);

    const button = screen.getByRole("button", { name: "Verwijderen" });

    expect(button.className).toContain("cursor-pointer");
    expect(button.className).toContain("text-red-700");
    expect(button.className).toContain("hover:bg-red-50");
  });

  test("secondary link rendert als navigatieknop", () => {
    render(<SecondaryLink href="/dashboard">Dashboard</SecondaryLink>);

    const link = screen.getByRole("link", { name: "Dashboard" });

    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(link.className).toContain("cursor-pointer");
  });
});
