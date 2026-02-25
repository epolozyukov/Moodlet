import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PetSprite from "@/app/components/PetSprite";

describe("PetSprite", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} stage="child" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders different content for sick state", () => {
    const { container: sickContainer } = render(
      <PetSprite moodLabel="critical" isSick={true} isSleeping={false} stage="child" />
    );
    const { container: healthyContainer } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} stage="child" />
    );
    expect(sickContainer.innerHTML).not.toBe(healthyContainer.innerHTML);
  });

  it("renders different content for sleeping state", () => {
    const { container: sleepingContainer } = render(
      <PetSprite moodLabel="neutral" isSick={false} isSleeping={true} stage="child" />
    );
    const { container: awakeContainer } = render(
      <PetSprite moodLabel="neutral" isSick={false} isSleeping={false} stage="child" />
    );
    expect(sleepingContainer.innerHTML).not.toBe(awakeContainer.innerHTML);
  });

  it("applies data-pet-state attribute reflecting current state", () => {
    const { container } = render(
      <PetSprite moodLabel="sad" isSick={false} isSleeping={false} stage="child" />
    );
    const el = container.querySelector("[data-pet-state]");
    expect(el).toBeInTheDocument();
    expect(el!.getAttribute("data-pet-state")).toBe("sad");
  });

  it("data-pet-state is 'sick' when isSick is true", () => {
    const { container } = render(
      <PetSprite moodLabel="critical" isSick={true} isSleeping={false} stage="child" />
    );
    expect(container.querySelector("[data-pet-state]")!.getAttribute("data-pet-state")).toBe("sick");
  });

  it("data-pet-state is 'sleeping' when isSleeping is true", () => {
    const { container } = render(
      <PetSprite moodLabel="neutral" isSick={false} isSleeping={true} stage="child" />
    );
    expect(container.querySelector("[data-pet-state]")!.getAttribute("data-pet-state")).toBe("sleeping");
  });

  it("applies data-stage attribute with current stage", () => {
    const { container } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} stage="teen" />
    );
    expect(container.querySelector("[data-stage]")!.getAttribute("data-stage")).toBe("teen");
  });

  it("renders different emoji for egg vs adult stage", () => {
    const { container: eggContainer } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} stage="egg" />
    );
    const { container: adultContainer } = render(
      <PetSprite moodLabel="happy" isSick={false} isSleeping={false} stage="adult" />
    );
    expect(eggContainer.innerHTML).not.toBe(adultContainer.innerHTML);
  });
});
