import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tokenize } from "@/lib/text/tokenize";
import { PracticeRunner } from "./PracticeRunner";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const submitReview = vi.fn(async (..._args: unknown[]) => ({
  ok: true,
  feedback: [{ cardId: "c1", correct: true, answer: "preso", grade: "good" }],
}));
vi.mock("@/lib/practice/actions", () => ({
  submitReview: (...args: unknown[]) => submitReview(...args),
  getCardOptions: vi.fn(async () => ({ ok: true, options: ["preso", "bevut"] })),
}));
const getTranslation = vi.fn(
  async (
    ..._args: unknown[]
  ): Promise<{ ok: true; text: string | null } | { ok: false; error: string }> => ({
    ok: true,
    text: "Today I had a coffee.",
  }),
);
vi.mock("@/lib/translate/actions", () => ({
  getTranslation: (...args: unknown[]) => getTranslation(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const items = [
  {
    sentenceId: "s1",
    text: "Oggi ho preso un caffè.",
    tokens: tokenize("Oggi ho preso un caffè."),
    blanks: [{ cardId: "c1", tokenIndex: 4 }], // "preso"
  },
];

describe("PracticeRunner", () => {
  it("submits a typed answer and shows feedback", async () => {
    render(<PracticeRunner items={items} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "preso");
    await userEvent.keyboard("{Enter}");
    expect(submitReview).toHaveBeenCalledWith([{ cardId: "c1", input: "preso", usedHint: false }]);
    // After grading, the submit button switches to "Next" (feedback shown).
    expect(await screen.findByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<PracticeRunner items={[]} />);
    expect(screen.getByText(/nothing due/i)).toBeInTheDocument();
  });

  it("shows the sentence translation under the sentence when a translation language is set", async () => {
    render(<PracticeRunner items={items} translationLang="en" />);
    expect(await screen.findByText(/Today I had a coffee/i)).toBeInTheDocument();
    expect(getTranslation).toHaveBeenCalledWith("s1", "en");
  });

  it("does not fetch or show a translation when there is no translation language", () => {
    render(<PracticeRunner items={items} translationLang={null} />);
    expect(getTranslation).not.toHaveBeenCalled();
  });

  it("counts the shown translation as a hint when the setting is on", async () => {
    render(<PracticeRunner items={items} translationLang="en" translationCountsAsHint />);
    await screen.findByText(/Today I had a coffee/i);
    await userEvent.type(screen.getByRole("textbox"), "preso");
    await userEvent.keyboard("{Enter}");
    expect(submitReview).toHaveBeenCalledWith([{ cardId: "c1", input: "preso", usedHint: true }]);
  });

  it("does not count the translation as a hint when the setting is off", async () => {
    render(<PracticeRunner items={items} translationLang="en" translationCountsAsHint={false} />);
    await screen.findByText(/Today I had a coffee/i);
    await userEvent.type(screen.getByRole("textbox"), "preso");
    await userEvent.keyboard("{Enter}");
    expect(submitReview).toHaveBeenCalledWith([{ cardId: "c1", input: "preso", usedHint: false }]);
  });
});
