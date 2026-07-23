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

  it("shows a help tooltip for every spaced-repetition field", () => {
    render(<SettingsForm workspaceId="w1" settings={DEFAULT_SETTINGS} />);
    expect(screen.getAllByRole("button", { name: /more info/i })).toHaveLength(7);
    expect(
      screen.getByText(/global multiplier applied to every new interval/i),
    ).toBeTruthy();
  });

  it("keeps the field label lookup working after adding units and tooltips", () => {
    render(<SettingsForm workspaceId="w1" settings={DEFAULT_SETTINGS} />);
    // Unit is shown in the label and the input remains uniquely reachable.
    const maxInterval = screen.getByLabelText(/max interval/i) as HTMLInputElement;
    expect(maxInterval.value).toBe(String(DEFAULT_SETTINGS.sr.maxInterval));
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
