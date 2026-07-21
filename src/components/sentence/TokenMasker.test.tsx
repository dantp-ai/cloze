import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tokenize } from "@/lib/text/tokenize";
import { TokenMasker } from "./TokenMasker";

const tokens = tokenize("Oggi ho preso");

describe("TokenMasker", () => {
  it("renders a button per word and toggles masking on click", async () => {
    const onChange = vi.fn();
    render(<TokenMasker tokens={tokens} masked={[]} onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3); // Oggi, ho, preso
    await userEvent.click(screen.getByRole("button", { name: "preso" }));
    expect(onChange).toHaveBeenCalledWith([4]); // token index of "preso"
  });

  it("unmasks an already-masked word", async () => {
    const onChange = vi.fn();
    render(<TokenMasker tokens={tokens} masked={[0]} onChange={onChange} />);
    const oggi = screen.getByRole("button", { name: "Oggi" });
    expect(oggi).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(oggi);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
