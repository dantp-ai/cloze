import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("toggles the dark class on the document root", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: /theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
