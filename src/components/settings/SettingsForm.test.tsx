import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsForm } from "./SettingsForm";
import { DEFAULT_SETTINGS } from "@/lib/settings/workspace-settings";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const updateSettings = vi.fn(async (..._args: unknown[]) => ({ ok: true }));
vi.mock("@/lib/settings/actions", () => ({
  updateSettings: (...args: unknown[]) => updateSettings(...args),
}));

describe("SettingsForm", () => {
  it("renders SR fields seeded from the current settings", () => {
    render(<SettingsForm workspaceId="w1" settings={DEFAULT_SETTINGS} />);
    const newCards = screen.getByLabelText(/new cards per session/i) as HTMLInputElement;
    expect(newCards.value).toBe(String(DEFAULT_SETTINGS.sr.newCardsPerSession));
  });

  it("submits updated settings", async () => {
    render(<SettingsForm workspaceId="w1" settings={DEFAULT_SETTINGS} />);
    const newCards = screen.getByLabelText(/new cards per session/i);
    await userEvent.clear(newCards);
    await userEvent.type(newCards, "5");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(updateSettings).toHaveBeenCalledWith(
      "w1",
      expect.objectContaining({ sr: expect.objectContaining({ newCardsPerSession: 5 }) }),
    );
  });
});
