import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageCombobox } from "./LanguageCombobox";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "sw", label: "Swahili" },
];

function open(triggerName = /add/i) {
  fireEvent.click(screen.getByRole("button", { name: triggerName }));
}

describe("LanguageCombobox", () => {
  it("opens and lists options on trigger click", () => {
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={vi.fn()} />);
    open();
    expect(screen.getByRole("option", { name: /english/i })).toBeInTheDocument();
  });

  it("filters case-insensitively by name", () => {
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={vi.fn()} />);
    open();
    fireEvent.change(screen.getByLabelText("Search languages"), { target: { value: "SPAN" } });
    expect(screen.getByRole("option", { name: /spanish/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /english/i })).not.toBeInTheDocument();
  });

  it("filters by code prefix", () => {
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={vi.fn()} />);
    open();
    fireEvent.change(screen.getByLabelText("Search languages"), { target: { value: "sw" } });
    expect(screen.getByRole("option", { name: /swahili/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /english/i })).not.toBeInTheDocument();
  });

  it("calls onSelect with the chosen code", () => {
    const onSelect = vi.fn();
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={onSelect} />);
    open();
    fireEvent.click(screen.getByRole("option", { name: /english/i }));
    expect(onSelect).toHaveBeenCalledWith("en");
  });

  it("hides excluded codes", () => {
    render(
      <LanguageCombobox languages={languages} triggerLabel="Add" exclude={["en"]} onSelect={vi.fn()} />,
    );
    open();
    expect(screen.queryByRole("option", { name: /english/i })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /spanish/i })).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={vi.fn()} />);
    open();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("moves the active-option highlight with ArrowDown/ArrowUp", () => {
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={vi.fn()} />);
    open();
    const input = screen.getByLabelText("Search languages");
    let options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
    expect(options[2]).toHaveAttribute("aria-selected", "false");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "false");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
  });

  it("selects the highlighted option on Enter", () => {
    const onSelect = vi.fn();
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={onSelect} />);
    open();
    const input = screen.getByLabelText("Search languages");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("es");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the listbox on outside pointerdown", () => {
    render(<LanguageCombobox languages={languages} triggerLabel="Add" onSelect={vi.fn()} />);
    open();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
