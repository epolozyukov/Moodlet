import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsBars from "@/app/components/StatsBars";

describe("StatsBars", () => {
  it("renders all 4 stat labels", () => {
    render(<StatsBars hunger={80} hygiene={80} energy={80} mood={80} />);
    expect(screen.getByText(/hunger/i)).toBeInTheDocument();
    expect(screen.getByText(/hygiene/i)).toBeInTheDocument();
    expect(screen.getByText(/energy/i)).toBeInTheDocument();
    expect(screen.getByText(/mood/i)).toBeInTheDocument();
  });

  it("renders 4 progress bars", () => {
    render(<StatsBars hunger={80} hygiene={80} energy={80} mood={80} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(4);
  });

  it("sets aria-valuenow on each bar", () => {
    render(<StatsBars hunger={45} hygiene={70} energy={30} mood={48} />);
    const bars = screen.getAllByRole("progressbar");
    const values = bars.map((b) => Number(b.getAttribute("aria-valuenow")));
    expect(values).toContain(45);
    expect(values).toContain(70);
    expect(values).toContain(30);
    expect(values).toContain(48);
  });

  it("sets aria-valuemax to 100", () => {
    render(<StatsBars hunger={50} hygiene={50} energy={50} mood={50} />);
    const bars = screen.getAllByRole("progressbar");
    bars.forEach((bar) => expect(bar.getAttribute("aria-valuemax")).toBe("100"));
  });

  it("applies a low-stat indicator when a stat is below 20", () => {
    const { container } = render(
      <StatsBars hunger={10} hygiene={80} energy={80} mood={56} />
    );
    // Should have some element with a "low" or "critical" class/attribute
    expect(container.querySelector("[data-low]")).toBeInTheDocument();
  });
});
