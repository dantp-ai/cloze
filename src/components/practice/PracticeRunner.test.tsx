import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tokenize } from "@/lib/text/tokenize";
import { PracticeRunner } from "./PracticeRunner";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const submitReview = vi.fn(async (..._args: unknown[]) => ({
  ok: true,
  feedback: [{ cardId: "c1", correct: true, answer: "preso", grade: "good" }],
}));
const getCardOptions = vi.fn(async (..._args: unknown[]) => ({
  ok: true,
  options: ["preso", "bevut"],
}));
vi.mock("@/lib/practice/actions", () => ({
  submitReview: (...args: unknown[]) => submitReview(...args),
  getCardOptions: (...args: unknown[]) => getCardOptions(...args),
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

// A sentence with two masked words, for keyboard navigation between blanks.
const multiText = "Oggi ho preso un caffè.";
const multiToks = tokenize(multiText);
const multiMask = multiToks.flatMap((t, i) => (t.maskable ? [i] : []));
const multiItems = [
  {
    sentenceId: "s1",
    text: multiText,
    tokens: multiToks,
    blanks: [
      { cardId: "c1", tokenIndex: multiMask[0] },
      { cardId: "c2", tokenIndex: multiMask[1] },
    ],
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

  it("auto-focuses the first masked word", () => {
    render(<PracticeRunner items={multiItems} />);
    expect(screen.getByLabelText(`blank ${multiMask[0]}`)).toHaveFocus();
  });

  it("moves between masked words with Cmd+ArrowRight / Cmd+ArrowLeft", () => {
    render(<PracticeRunner items={multiItems} />);
    const first = screen.getByLabelText(`blank ${multiMask[0]}`);
    const second = screen.getByLabelText(`blank ${multiMask[1]}`);
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "ArrowRight", metaKey: true });
    expect(second).toHaveFocus();
    fireEvent.keyDown(second, { key: "ArrowLeft", metaKey: true });
    expect(first).toHaveFocus();
  });

  it("reveals the hint when '?' is pressed on a masked word", async () => {
    render(<PracticeRunner items={items} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "?" });
    expect(getCardOptions).toHaveBeenCalledWith("c1");
    expect(await screen.findByRole("button", { name: "preso" })).toBeInTheDocument();
  });

  it("types letters normally, including 'h' as the first letter", async () => {
    render(<PracticeRunner items={items} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "ho");
    expect(getCardOptions).not.toHaveBeenCalled();
    expect(input).toHaveValue("ho");
  });
});
