import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/workspace/actions", () => ({ switchWorkspace: vi.fn() }));

const workspaces = [
  { id: "a", name: "Italian", learningLang: "it", translationLangs: ["fr", "en"] },
  { id: "b", name: "Spanish", learningLang: "es", translationLangs: ["en"] },
];

describe("WorkspaceSwitcher", () => {
  it("shows the active workspace name", () => {
    render(<WorkspaceSwitcher workspaces={workspaces} activeId="a" />);
    expect(screen.getByRole("button", { name: /italian/i })).toBeInTheDocument();
  });

  it("renders nothing when there are no workspaces", () => {
    const { container } = render(<WorkspaceSwitcher workspaces={[]} activeId={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
