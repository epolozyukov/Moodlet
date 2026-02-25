import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { PetState } from "@/lib/types";

const makeState = (overrides: Partial<PetState> = {}): PetState => ({
  name: "Bubbles",
  hunger: 80,
  hygiene: 80,
  energy: 80,
  happiness: 80,
  health: 100,
  lastUpdated: Date.now(),
  isSleeping: false,
  sleepStartTime: null,
  firstOpenDate: "2026-01-01",
  lastVisitDate: "2026-01-01",
  currentStreak: 1,
  chatHistory: [],
  lastUserAction: "none",
  sicknessTicks: 0,
  isSick: false,
  sicknessStart: null,
  hungerCriticalStart: null,
  isDead: false,
  stage: "child",
  stageStartTime: Date.now(),
  careScore: 80,
  lastAlertTime: 0,
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

  it("includes current happiness stat", () => {
    const prompt = buildSystemPrompt(makeState({ happiness: 55 }), "neutral");
    expect(prompt).toContain("55");
  });

  it("includes current health stat", () => {
    const prompt = buildSystemPrompt(makeState({ health: 75 }), "neutral");
    expect(prompt).toContain("75");
  });

  it("includes the mood label", () => {
    const prompt = buildSystemPrompt(makeState(), "happy");
    expect(prompt).toContain("happy");
  });

  it("includes the stage", () => {
    const prompt = buildSystemPrompt(makeState({ stage: "teen" }), "neutral");
    expect(prompt).toContain("teen");
  });

  it("includes lastUserAction", () => {
    const prompt = buildSystemPrompt(makeState({ lastUserAction: "meal" }), "neutral");
    expect(prompt).toContain("meal");
  });

  it("instructs 120-word limit", () => {
    const prompt = buildSystemPrompt(makeState(), "neutral");
    expect(prompt.toLowerCase()).toContain("120");
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

  it("includes low-energy fuzzy-thought block when energy < 30", () => {
    const prompt = buildSystemPrompt(makeState({ energy: 20 }), "neutral");
    expect(prompt.toLowerCase()).toContain("exhausted");
  });

  it("does not include low-energy block when energy is normal", () => {
    const prompt = buildSystemPrompt(makeState({ energy: 60 }), "neutral");
    expect(prompt.toLowerCase()).not.toContain("exhausted");
  });

  it("includes jailbreak resistance instruction", () => {
    const prompt = buildSystemPrompt(makeState(), "neutral");
    expect(prompt.toLowerCase()).toContain("break character");
  });
});
