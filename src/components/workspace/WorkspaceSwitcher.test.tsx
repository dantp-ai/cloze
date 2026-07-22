import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/workspace/actions", () => ({ switchWorkspace: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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

  it("offers a link to create a new workspace when open", () => {
    render(<WorkspaceSwitcher workspaces={workspaces} activeId="a" />);
    fireEvent.click(screen.getByRole("button", { name: /italian/i }));
    const link = screen.getByRole("menuitem", { name: /new workspace/i });
    expect(link).toHaveAttribute("href", "/workspaces");
  });
});
