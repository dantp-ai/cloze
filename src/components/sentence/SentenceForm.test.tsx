import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SentenceForm } from "./SentenceForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
const createSentence = vi.fn(async (..._args: unknown[]) => ({ ok: true, id: "s1" }));
vi.mock("@/lib/sentence/actions", () => ({
  createSentence: (...args: unknown[]) => createSentence(...args),
  updateSentence: vi.fn(),
}));
const createTopic = vi.fn(async (..._args: unknown[]) => ({ ok: true, id: "t2" }));
vi.mock("@/lib/topic/actions", () => ({ createTopic: (...args: unknown[]) => createTopic(...args) }));

const props = {
  workspaceId: "w1",
  translationLangs: ["en"],
  topics: [{ id: "t1", name: "Coffee" }],
  mode: "create" as const,
};

describe("SentenceForm", () => {
  it("renders a translation input per language", () => {
    render(<SentenceForm {...props} translationLangs={["en", "fr"]} />);
    expect(screen.getByLabelText(/translation \(en\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/translation \(fr\)/i)).toBeInTheDocument();
  });

  it("tokenizes typed text into maskable word buttons and submits", async () => {
    render(<SentenceForm {...props} />);
    await userEvent.type(screen.getByLabelText(/sentence/i), "Bevo tè");
    await userEvent.click(screen.getByRole("button", { name: "Bevo" }));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(createSentence).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "w1", text: "Bevo tè", maskedIndices: [0] }),
    );
  });

  it("creates a new topic inline", async () => {
    render(<SentenceForm {...props} />);
    await userEvent.type(screen.getByLabelText(/new topic name/i), "Coffee");
    await userEvent.click(screen.getByRole("button", { name: /add topic/i }));
    expect(createTopic).toHaveBeenCalledWith("w1", "Coffee");
  });
});
