import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";
import { createWorkspace } from "@/lib/workspace/actions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/workspace/actions", () => ({ createWorkspace: vi.fn() }));

function addSwahili() {
  fireEvent.click(screen.getByRole("button", { name: /add language/i }));
  fireEvent.change(screen.getByLabelText("Search languages"), { target: { value: "swahili" } });
  fireEvent.click(screen.getByRole("option", { name: /swahili/i }));
}

describe("CreateWorkspaceForm", () => {
  beforeEach(() => {
    vi.mocked(createWorkspace).mockReset();
    vi.mocked(createWorkspace).mockResolvedValue({ ok: true, id: "w1" });
  });

  it("adds a language chip via the combobox and submits its code", () => {
    render(<CreateWorkspaceForm />);
    addSwahili();
    expect(screen.getByRole("button", { name: /remove swahili/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));
    expect(createWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ translationLangs: expect.arrayContaining(["en", "sw"]) }),
    );
  });

  it("removes an added chip", () => {
    render(<CreateWorkspaceForm />);
    addSwahili();
    fireEvent.click(screen.getByRole("button", { name: /remove swahili/i }));
    expect(screen.queryByRole("button", { name: /remove swahili/i })).not.toBeInTheDocument();
  });

  it("toggles a common quick-pick chip", () => {
    render(<CreateWorkspaceForm />);
    fireEvent.click(screen.getByRole("button", { name: "Spanish", pressed: false }));
    expect(screen.getByRole("button", { name: "Spanish", pressed: true })).toBeInTheDocument();
  });
});
