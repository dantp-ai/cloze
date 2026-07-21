import { describe, it, expect, vi } from "vitest";
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
});
