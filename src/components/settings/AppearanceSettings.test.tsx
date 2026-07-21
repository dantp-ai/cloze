import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppearanceSettings } from "./AppearanceSettings";
import { ZEN_DEFAULT_KEY } from "@/lib/appearance/zen-preference";

function renderSettings() {
  return render(
    <ThemeProvider>
      <AppearanceSettings />
    </ThemeProvider>,
  );
}

describe("AppearanceSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("shows the current theme and switches it", async () => {
    renderSettings();
    const themeButton = screen.getByRole("button", { name: /light/i });
    await userEvent.click(themeButton);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the start-in-zen-mode preference", async () => {
    renderSettings();
    const zen = screen.getByLabelText(/start in zen mode/i);
    expect(zen).not.toBeChecked();

    await userEvent.click(zen);

    expect(zen).toBeChecked();
    expect(localStorage.getItem(ZEN_DEFAULT_KEY)).toBe("true");
  });

  it("reflects a previously saved zen preference", async () => {
    localStorage.setItem(ZEN_DEFAULT_KEY, "true");
    renderSettings();
    expect(await screen.findByLabelText(/start in zen mode/i)).toBeChecked();
  });
});
