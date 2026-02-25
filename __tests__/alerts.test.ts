import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shouldAlert } from "@/lib/alerts";
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

describe("shouldAlert", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns false when all stats are healthy", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ lastAlertTime: 0 }))).toBe(false);
  });

  it("returns true when hunger is below 30", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ hunger: 29, lastAlertTime: 0 }))).toBe(true);
  });

  it("returns false when hunger is exactly 30", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ hunger: 30, lastAlertTime: 0 }))).toBe(false);
  });

  it("returns true when energy is below 30", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ energy: 29, lastAlertTime: 0 }))).toBe(true);
  });

  it("returns true when hygiene is below 40", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ hygiene: 39, lastAlertTime: 0 }))).toBe(true);
  });

  it("returns true when happiness is below 40", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ happiness: 39, lastAlertTime: 0 }))).toBe(true);
  });

  it("returns true when isSick is true", () => {
    vi.setSystemTime(1_000_000);
    expect(shouldAlert(makeState({ isSick: true, lastAlertTime: 0 }))).toBe(true);
  });

  it("respects 10-minute cooldown — returns false if last alert was < 10 min ago", () => {
    const now = 10_000_000;
    vi.setSystemTime(now);
    const recentAlert = now - 5 * 60 * 1000; // 5 min ago
    expect(shouldAlert(makeState({ hunger: 10, lastAlertTime: recentAlert }))).toBe(false);
  });

  it("allows alert again after cooldown has passed", () => {
    const now = 10_000_000;
    vi.setSystemTime(now);
    const oldAlert = now - 11 * 60 * 1000; // 11 min ago
    expect(shouldAlert(makeState({ hunger: 10, lastAlertTime: oldAlert }))).toBe(true);
  });
});
