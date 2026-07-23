import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoverTranslate } from "./HoverTranslate";

const getTranslation = vi.fn(
  async (
    ..._args: unknown[]
  ): Promise<{ ok: true; text: string | null } | { ok: false; error: string }> => ({
    ok: true,
    text: "the cat",
  }),
);
vi.mock("@/lib/translate/actions", () => ({
  getTranslation: (...args: unknown[]) => getTranslation(...args),
}));

describe("HoverTranslate", () => {
  it("does not translate on hover without the Command key", async () => {
    render(
      <HoverTranslate sentenceId="s1" lang="en">
        <span>il gatto</span>
      </HoverTranslate>,
    );
    await userEvent.hover(screen.getByText("il gatto"));
    expect(getTranslation).not.toHaveBeenCalled();
  });

  it("translates on hover while Command is held and shows the result", async () => {
    render(
      <HoverTranslate sentenceId="s1" lang="en">
        <span>il gatto</span>
      </HoverTranslate>,
    );
    fireEvent.keyDown(window, { key: "Meta" });
    await userEvent.hover(screen.getByText("il gatto"));
    expect(getTranslation).toHaveBeenCalledWith("s1", "en");
    expect(await screen.findByText("the cat")).toBeInTheDocument();
  });

  it("shows the returned error message when translation is unavailable", async () => {
    getTranslation.mockResolvedValueOnce({ ok: false, error: "German isn't supported for translation yet." });
    render(
      <HoverTranslate sentenceId="s1" lang="de">
        <span>il gatto</span>
      </HoverTranslate>,
    );
    fireEvent.keyDown(window, { key: "Meta" });
    await userEvent.hover(screen.getByText("il gatto"));
    expect(await screen.findByText("German isn't supported for translation yet.")).toBeInTheDocument();
  });
});
