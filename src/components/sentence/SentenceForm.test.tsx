import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SentenceForm } from "./SentenceForm";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
const createSentence = vi.fn(async (..._args: unknown[]) => ({ ok: true, id: "s1" }));
vi.mock("@/lib/sentence/actions", () => ({
  createSentence: (...args: unknown[]) => createSentence(...args),
  updateSentence: vi.fn(),
}));
const createTopic = vi.fn(async (..._args: unknown[]) => ({ ok: true, id: "t2" }));
vi.mock("@/lib/topic/actions", () => ({ createTopic: (...args: unknown[]) => createTopic(...args) }));

beforeEach(() => {
  vi.clearAllMocks();
});

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
    await userEvent.click(screen.getByRole("button", { name: /save sentence/i }));
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

  it("navigates to browse after 'Save sentence'", async () => {
    render(<SentenceForm {...props} />);
    await userEvent.type(screen.getByLabelText(/sentence/i), "Bevo tè");
    await userEvent.click(screen.getByRole("button", { name: /save sentence/i }));
    expect(createSentence).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/browse");
  });

  it("stays on the form and clears it after 'Save & add another'", async () => {
    render(<SentenceForm {...props} />);
    await userEvent.type(screen.getByLabelText(/sentence/i), "Bevo tè");
    await userEvent.type(screen.getByLabelText(/translation \(en\)/i), "I drink tea");
    await userEvent.click(screen.getByRole("button", { name: /add another/i }));
    expect(createSentence).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/sentence/i)).toHaveValue("");
    expect(screen.getByLabelText(/translation \(en\)/i)).toHaveValue("");
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it("does not offer 'add another' in edit mode", () => {
    render(
      <SentenceForm
        {...props}
        mode="edit"
        sentenceId="s1"
        initial={{ text: "Ciao", maskedIndices: [], topicId: null, translations: {} }}
      />,
    );
    expect(screen.queryByRole("button", { name: /add another/i })).not.toBeInTheDocument();
  });
});
