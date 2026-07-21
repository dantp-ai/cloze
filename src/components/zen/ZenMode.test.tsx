import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZenProvider } from "./ZenProvider";
import { ZenToggle } from "./ZenToggle";
import { ShellFrame } from "@/components/shell/ShellFrame";

function Shell() {
  return (
    <ZenProvider>
      <ShellFrame rail={<div>RAIL</div>} topBar={<div><ZenToggle /></div>}>
        <p>CONTENT</p>
      </ShellFrame>
    </ZenProvider>
  );
}

describe("zen mode", () => {
  it("hides the rail and top bar when toggled, and restores them on exit", async () => {
    render(<Shell />);
    expect(screen.getByText("RAIL")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /zen/i }));
    expect(screen.queryByText("RAIL")).not.toBeInTheDocument();
    expect(screen.getByText("CONTENT")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /exit zen/i }));
    expect(screen.getByText("RAIL")).toBeInTheDocument();
  });
});
