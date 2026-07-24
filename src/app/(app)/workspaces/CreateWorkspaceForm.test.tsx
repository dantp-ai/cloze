import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";
import { createWorkspace } from "@/lib/workspace/actions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/workspace/actions", () => ({ createWorkspace: vi.fn() }));

function addPolish() {
  fireEvent.click(screen.getByRole("button", { name: /add language/i }));
  fireEvent.change(screen.getByLabelText("Search languages"), { target: { value: "polish" } });
  fireEvent.click(screen.getByRole("option", { name: /polish/i }));
}

describe("CreateWorkspaceForm", () => {
  beforeEach(() => {
    vi.mocked(createWorkspace).mockReset();
    vi.mocked(createWorkspace).mockResolvedValue({ ok: true, id: "w1" });
  });

  it("adds a language chip via the combobox and submits its code", () => {
    render(<CreateWorkspaceForm />);
    addPolish();
    expect(screen.getByRole("button", { name: /remove polish/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));
    expect(createWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ translationLangs: expect.arrayContaining(["en", "pl"]) }),
    );
  });

  it("removes an added chip", () => {
    render(<CreateWorkspaceForm />);
    addPolish();
    fireEvent.click(screen.getByRole("button", { name: /remove polish/i }));
    expect(screen.queryByRole("button", { name: /remove polish/i })).not.toBeInTheDocument();
  });

  it("toggles a common quick-pick chip", () => {
    render(<CreateWorkspaceForm />);
    fireEvent.click(screen.getByRole("button", { name: "Spanish", pressed: false }));
    expect(screen.getByRole("button", { name: "Spanish", pressed: true })).toBeInTheDocument();
  });
});
