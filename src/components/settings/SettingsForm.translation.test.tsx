import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsForm } from "./SettingsForm";
import { DEFAULT_SETTINGS } from "@/lib/settings/workspace-settings";

const updateSettings = vi.fn(async (..._args: unknown[]) => ({ ok: true }));
vi.mock("@/lib/settings/actions", () => ({
  updateSettings: (...args: unknown[]) => updateSettings(...args),
}));

describe("SettingsForm translation section", () => {
  it("renders the provider select seeded from settings", () => {
    render(<SettingsForm workspaceId="w1" settings={DEFAULT_SETTINGS} />);
    const select = screen.getByLabelText(/translation provider/i) as HTMLSelectElement;
    expect(select.value).toBe("manual");
  });

  it("submits the chosen provider and typed api key", async () => {
    render(<SettingsForm workspaceId="w1" settings={DEFAULT_SETTINGS} hasApiKey={false} />);
    await userEvent.selectOptions(screen.getByLabelText(/translation provider/i), "deepl");
    await userEvent.type(screen.getByLabelText(/api key/i), "my-key");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(updateSettings).toHaveBeenCalledWith(
      "w1",
      expect.objectContaining({ translation: { provider: "deepl", apiKey: "my-key" } }),
    );
  });
});
