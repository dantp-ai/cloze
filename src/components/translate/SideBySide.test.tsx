import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SideBySide } from "./SideBySide";

const getTranslation = vi.fn(async (..._args: unknown[]) => ({ ok: true, text: "the cat (fetched)" }));
vi.mock("@/lib/translate/actions", () => ({
  getTranslation: (...args: unknown[]) => getTranslation(...args),
}));

const rows: { id: string; text: string; translations: Record<string, string> }[] = [
  { id: "s1", text: "il gatto", translations: { en: "the cat" } },
  { id: "s2", text: "il cane", translations: {} },
];

describe("SideBySide", () => {
  it("shows the learning text and the stored translation for the selected language", () => {
    render(<SideBySide langs={["en"]} rows={rows} />);
    expect(screen.getByText("il gatto")).toBeInTheDocument();
    expect(screen.getByText("the cat")).toBeInTheDocument();
  });

  it("fetches a missing translation on demand", async () => {
    render(<SideBySide langs={["en"]} rows={rows} />);
    // s2 has no stored translation -> a Translate button
    await userEvent.click(screen.getByRole("button", { name: /translate/i }));
    expect(getTranslation).toHaveBeenCalledWith("s2", "en");
    expect(await screen.findByText("the cat (fetched)")).toBeInTheDocument();
  });
});
