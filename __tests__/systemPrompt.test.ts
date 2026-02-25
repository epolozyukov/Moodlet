import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { PetState } from "@/lib/types";

const makeState = (overrides: Partial<PetState> = {}): PetState => ({
  name: "Bubbles",
  hunger: 80,
  hygiene: 80,
  energy: 80,
  lastUpdated: Date.now(),
  isSleeping: false,
  sleepStartTime: null,
  firstOpenDate: "2026-01-01",
  lastVisitDate: "2026-01-01",
  currentStreak: 1,
  chatHistory: [],
  lastUserAction: "none",
  ...overrides,
});

describe("buildSystemPrompt", () => {
  it("includes the pet's name", () => {
    const prompt = buildSystemPrompt(makeState({ name: "Snuggles" }), "happy");
    expect(prompt).toContain("Snuggles");
  });

  it("includes current hunger stat", () => {
    const prompt = buildSystemPrompt(makeState({ hunger: 45 }), "neutral");
    expect(prompt).toContain("45");
  });

  it("includes current hygiene stat", () => {
    const prompt = buildSystemPrompt(makeState({ hygiene: 30 }), "sad");
    expect(prompt).toContain("30");
  });

  it("includes current energy stat", () => {
    const prompt = buildSystemPrompt(makeState({ energy: 10 }), "critical");
    expect(prompt).toContain("10");
  });

  it("includes the mood label", () => {
    const prompt = buildSystemPrompt(makeState(), "happy");
    expect(prompt).toContain("happy");
  });

  it("includes lastUserAction", () => {
    const prompt = buildSystemPrompt(makeState({ lastUserAction: "feed" }), "neutral");
    expect(prompt).toContain("feed");
  });

  it("instructs 40-word limit", () => {
    const prompt = buildSystemPrompt(makeState(), "neutral");
    expect(prompt.toLowerCase()).toContain("40");
  });

  it("instructs no markdown", () => {
    const prompt = buildSystemPrompt(makeState(), "neutral");
    expect(prompt.toLowerCase()).toContain("markdown");
  });

  it("instructs no emojis", () => {
    const prompt = buildSystemPrompt(makeState(), "neutral");
    expect(prompt.toLowerCase()).toContain("emoji");
  });

  it("returns a non-empty string", () => {
    const prompt = buildSystemPrompt(makeState(), "neutral");
    expect(prompt.length).toBeGreaterThan(100);
  });
});
