import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldTooltip } from "./FieldTooltip";

describe("FieldTooltip", () => {
  it("renders an accessible info button linked to the tooltip text", () => {
    render(<FieldTooltip text="A helpful definition." />);
    const button = screen.getByRole("button", { name: /more info/i });
    const tip = screen.getByRole("tooltip");
    expect(tip.textContent).toContain("A helpful definition.");
    const describedBy = button.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(describedBy).toBe(tip.getAttribute("id"));
  });

  it("does not label the button with the definition text, to avoid clashing with field labels", () => {
    render(<FieldTooltip text="Starting ease definition." />);
    // The button's accessible name is generic, so getByLabelText on a field
    // label never resolves to this button.
    expect(screen.queryByRole("button", { name: /starting ease/i })).toBeNull();
  });
});
