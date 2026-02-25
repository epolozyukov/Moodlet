import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PetSprite from "@/app/components/PetSprite";

describe("PetSprite", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders different content for sick state", () => {
    const { container: sickContainer } = render(
      <PetSprite moodLabel="critical" isSick={true} isSleeping={false} />
    );
    const { container: healthyContainer } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} />
    );
    // The two containers should differ (different sprite/class)
    expect(sickContainer.innerHTML).not.toBe(healthyContainer.innerHTML);
  });

  it("renders different content for sleeping state", () => {
    const { container: sleepingContainer } = render(
      <PetSprite moodLabel="neutral" isSick={false} isSleeping={true} />
    );
    const { container: awakeContainer } = render(
      <PetSprite moodLabel="neutral" isSick={false} isSleeping={false} />
    );
    expect(sleepingContainer.innerHTML).not.toBe(awakeContainer.innerHTML);
  });

  it("applies a data attribute reflecting current state", () => {
    const { container } = render(
      <PetSprite moodLabel="sad" isSick={false} isSleeping={false} />
    );
    const el = container.querySelector("[data-pet-state]");
    expect(el).toBeInTheDocument();
    expect(el!.getAttribute("data-pet-state")).toBe("sad");
  });

  it("data-pet-state is 'sick' when isSick is true", () => {
    const { container } = render(
      <PetSprite moodLabel="critical" isSick={true} isSleeping={false} />
    );
    const el = container.querySelector("[data-pet-state]");
    expect(el!.getAttribute("data-pet-state")).toBe("sick");
  });

  it("data-pet-state is 'sleeping' when isSleeping is true", () => {
    const { container } = render(
      <PetSprite moodLabel="neutral" isSick={false} isSleeping={true} />
    );
    const el = container.querySelector("[data-pet-state]");
    expect(el!.getAttribute("data-pet-state")).toBe("sleeping");
  });
});
