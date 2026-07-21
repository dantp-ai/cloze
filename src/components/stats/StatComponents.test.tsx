import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatTile } from "./StatTile";
import { Heatmap } from "./Heatmap";
import { MasteryBar } from "./MasteryBar";

describe("stat components", () => {
  it("StatTile shows its label and value", () => {
    render(<StatTile label="Streak" value={5} />);
    expect(screen.getByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("Heatmap renders one titled cell per day", () => {
    const cells = [
      { date: "2026-01-13", count: 0 },
      { date: "2026-01-14", count: 2 },
      { date: "2026-01-15", count: 5 },
    ];
    render(<Heatmap cells={cells} />);
    expect(screen.getByTitle("2026-01-14: 2 reviews")).toBeInTheDocument();
    expect(screen.getByTitle("2026-01-15: 5 reviews")).toBeInTheDocument();
  });

  it("MasteryBar shows the bucket counts", () => {
    render(<MasteryBar mastery={{ new: 3, learning: 1, mature: 6 }} />);
    expect(screen.getByText(/new/i)).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});
