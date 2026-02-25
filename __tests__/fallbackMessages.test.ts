import { describe, it, expect } from "vitest";
import { getFallbackMessage } from "@/lib/fallbackMessages";
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

describe("getFallbackMessage", () => {
  it("returns a non-empty string", () => {
    const message = getFallbackMessage(makeState(), "neutral");
    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });

  it("returns a different message for sick state", () => {
    const sickState = makeState({ isSick: true });
    const normalState = makeState();
    const sickMsg = getFallbackMessage(sickState, "critical");
    const normalMsg = getFallbackMessage(normalState, "happy");
    expect(sickMsg).not.toBe(normalMsg);
  });

  it("returns a different message for low-energy state", () => {
    const lowEnergy = makeState({ energy: 10 });
    const normal = makeState();
    const lowMsg = getFallbackMessage(lowEnergy, "sad");
    const normalMsg = getFallbackMessage(normal, "happy");
    expect(lowMsg).not.toBe(normalMsg);
  });

  it("never includes raw error text (no 'Error:', 'failed', 'undefined')", () => {
    const moods = ["happy", "neutral", "sad", "critical"] as const;
    for (const mood of moods) {
      const msg = getFallbackMessage(makeState(), mood);
      expect(msg.toLowerCase()).not.toContain("error:");
      expect(msg.toLowerCase()).not.toContain("undefined");
      expect(msg.toLowerCase()).not.toContain("failed");
    }
  });

  it("returns a short message (under 80 chars)", () => {
    const msg = getFallbackMessage(makeState(), "neutral");
    expect(msg.length).toBeLessThan(80);
  });
});
