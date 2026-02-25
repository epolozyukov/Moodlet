import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateStreak } from "@/lib/streak";
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

describe("updateStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not change streak when visiting on the same day", () => {
    vi.setSystemTime(new Date("2026-01-02T10:00:00Z"));
    const state = makeState({ lastVisitDate: "2026-01-02", currentStreak: 3 });
    const result = updateStreak(state);
    expect(result.currentStreak).toBe(3);
    expect(result.lastVisitDate).toBe("2026-01-02");
  });

  it("increments streak when visiting the day after last visit", () => {
    vi.setSystemTime(new Date("2026-01-03T10:00:00Z"));
    const state = makeState({ lastVisitDate: "2026-01-02", currentStreak: 3 });
    const result = updateStreak(state);
    expect(result.currentStreak).toBe(4);
    expect(result.lastVisitDate).toBe("2026-01-03");
  });

  it("resets streak to 1 when a day is missed", () => {
    vi.setSystemTime(new Date("2026-01-05T10:00:00Z"));
    const state = makeState({ lastVisitDate: "2026-01-02", currentStreak: 10 });
    const result = updateStreak(state);
    expect(result.currentStreak).toBe(1);
    expect(result.lastVisitDate).toBe("2026-01-05");
  });

  it("starts streak at 1 for a new user (firstOpenDate === today, no prior visit)", () => {
    vi.setSystemTime(new Date("2026-02-01T10:00:00Z"));
    const state = makeState({
      firstOpenDate: "2026-02-01",
      lastVisitDate: "2026-02-01",
      currentStreak: 1,
    });
    const result = updateStreak(state);
    expect(result.currentStreak).toBe(1);
  });

  it("resets streak when last visit was 2+ days ago", () => {
    vi.setSystemTime(new Date("2026-01-10T10:00:00Z"));
    const state = makeState({ lastVisitDate: "2026-01-07", currentStreak: 5 });
    const result = updateStreak(state);
    expect(result.currentStreak).toBe(1);
  });

  it("returns updated lastVisitDate to today", () => {
    vi.setSystemTime(new Date("2026-03-15T08:00:00Z"));
    const state = makeState({ lastVisitDate: "2026-03-14", currentStreak: 2 });
    const result = updateStreak(state);
    expect(result.lastVisitDate).toBe("2026-03-15");
  });
});
