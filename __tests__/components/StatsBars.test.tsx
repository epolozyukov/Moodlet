import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsBars from "@/app/components/StatsBars";

const defaultProps = {
  hunger: 80,
  hygiene: 80,
  energy: 80,
  happiness: 80,
  health: 100,
  mood: 80,
};

describe("StatsBars", () => {
  it("renders all 6 stat labels", () => {
    render(<StatsBars {...defaultProps} />);
    expect(screen.getByText(/hunger/i)).toBeInTheDocument();
    expect(screen.getByText(/hygiene/i)).toBeInTheDocument();
    expect(screen.getByText(/energy/i)).toBeInTheDocument();
    expect(screen.getByText(/happiness/i)).toBeInTheDocument();
    expect(screen.getByText(/health/i)).toBeInTheDocument();
    expect(screen.getByText(/mood/i)).toBeInTheDocument();
  });

  it("renders 6 progress bars", () => {
    render(<StatsBars {...defaultProps} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(6);
  });

  it("sets aria-valuenow on each bar", () => {
    render(<StatsBars {...defaultProps} hunger={45} hygiene={70} energy={30} happiness={55} health={90} mood={55} />);
    const bars = screen.getAllByRole("progressbar");
    const values = bars.map((b) => Number(b.getAttribute("aria-valuenow")));
    expect(values).toContain(45);
    expect(values).toContain(70);
    expect(values).toContain(30);
    expect(values).toContain(55);
    expect(values).toContain(90);
  });

  it("sets aria-valuemax to 100 on all bars", () => {
    render(<StatsBars {...defaultProps} />);
    screen.getAllByRole("progressbar").forEach((bar) => {
      expect(bar.getAttribute("aria-valuemax")).toBe("100");
    });
  });

  it("applies a low-stat indicator when a stat is below 20", () => {
    const { container } = render(<StatsBars {...defaultProps} hunger={10} />);
    expect(container.querySelector("[data-low]")).toBeInTheDocument();
  });

  it("shows Happiness bar with correct value", () => {
    render(<StatsBars {...defaultProps} happiness={42} />);
    const happinessBar = screen.getByRole("progressbar", { name: /happiness/i });
    expect(happinessBar.getAttribute("aria-valuenow")).toBe("42");
  });

  it("shows Health bar with correct value", () => {
    render(<StatsBars {...defaultProps} health={65} />);
    const healthBar = screen.getByRole("progressbar", { name: /health/i });
    expect(healthBar.getAttribute("aria-valuenow")).toBe("65");
  });
});
