import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyCrossSessionDecay, applyTickDecay, DECAY_RATES } from "@/lib/decayEngine";
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

describe("DECAY_RATES", () => {
  it("hunger decays every 3 minutes", () => {
    expect(DECAY_RATES.hunger).toBe(180_000);
  });

  it("hygiene decays every 5 minutes", () => {
    expect(DECAY_RATES.hygiene).toBe(300_000);
  });

  it("energy decays every 4 minutes", () => {
    expect(DECAY_RATES.energy).toBe(240_000);
  });
});

describe("applyTickDecay", () => {
  it("does not decay stats when interval is shorter than decay rate", () => {
    const state = makeState();
    const result = applyTickDecay(state, 10_000);
    expect(result.hunger).toBe(80);
    expect(result.hygiene).toBe(80);
    expect(result.energy).toBe(80);
  });

  it("decays hunger by 1 after exactly 3 minutes", () => {
    const result = applyTickDecay(makeState({ hunger: 80 }), 180_000);
    expect(result.hunger).toBe(79);
  });

  it("decays hygiene by 1 after exactly 5 minutes", () => {
    const result = applyTickDecay(makeState({ hygiene: 80 }), 300_000);
    expect(result.hygiene).toBe(79);
  });

  it("decays energy by 1 after exactly 4 minutes", () => {
    const result = applyTickDecay(makeState({ energy: 80 }), 240_000);
    expect(result.energy).toBe(79);
  });

  it("does not decay below 0", () => {
    const result = applyTickDecay(makeState({ hunger: 0 }), 180_000);
    expect(result.hunger).toBe(0);
  });

  it("decays multiple points for long elapsed time", () => {
    // 10 minutes = 600,000ms → hunger decays floor(600000/180000) = 3 points
    const result = applyTickDecay(makeState({ hunger: 80 }), 600_000);
    expect(result.hunger).toBe(77);
  });

  it("does not decay while sleeping", () => {
    const sleepStart = Date.now() - 30_000; // sleeping for 30s
    const state = makeState({ isSleeping: true, sleepStartTime: sleepStart, energy: 80 });
    const result = applyTickDecay(state, 180_000);
    // During sleep, decay is paused
    expect(result.hunger).toBe(80);
    expect(result.hygiene).toBe(80);
    expect(result.energy).toBe(80);
  });
});

describe("applyCrossSessionDecay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies no decay when no time has elapsed", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const state = makeState({ lastUpdated: now });
    const result = applyCrossSessionDecay(state);
    expect(result.hunger).toBe(80);
    expect(result.hygiene).toBe(80);
    expect(result.energy).toBe(80);
  });

  it("applies correct decay after 30 minutes offline", () => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const state = makeState({ lastUpdated: thirtyMinutesAgo });

    vi.setSystemTime(Date.now());
    const result = applyCrossSessionDecay(state);

    // 30 min = 1,800,000ms
    // hunger:  floor(1,800,000 / 180,000) = 10
    // hygiene: floor(1,800,000 / 300,000) = 6
    // energy:  floor(1,800,000 / 240,000) = 7
    expect(result.hunger).toBe(70);
    expect(result.hygiene).toBe(74);
    expect(result.energy).toBe(73);
  });

  it("does not decay below 0 for large elapsed time", () => {
    const longAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const state = makeState({ hunger: 10, lastUpdated: longAgo });
    const result = applyCrossSessionDecay(state);
    expect(result.hunger).toBe(0);
  });

  it("updates lastUpdated to current time", () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const state = makeState({ lastUpdated: tenMinutesAgo });
    const before = Date.now();
    const result = applyCrossSessionDecay(state);
    const after = Date.now();
    expect(result.lastUpdated).toBeGreaterThanOrEqual(before);
    expect(result.lastUpdated).toBeLessThanOrEqual(after);
  });

  it("resolves sleep: wakes pet if sleep duration exceeds 2 minutes", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const sleepStartTime = now - 3 * 60 * 1000; // slept 3 minutes ago
    const state = makeState({
      isSleeping: true,
      sleepStartTime,
      lastUpdated: sleepStartTime,
    });
    const result = applyCrossSessionDecay(state);
    expect(result.isSleeping).toBe(false);
    expect(result.sleepStartTime).toBeNull();
  });

  it("keeps pet sleeping if sleep duration is under 2 minutes", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const sleepStartTime = now - 1 * 60 * 1000; // only 1 minute ago
    const state = makeState({
      isSleeping: true,
      sleepStartTime,
      lastUpdated: sleepStartTime,
    });
    const result = applyCrossSessionDecay(state);
    expect(result.isSleeping).toBe(true);
  });

  it("applies decay only from sleep end (not full elapsed) after auto-wake", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    // Pet slept for 3 minutes (2 min pause + 1 min post-sleep decay)
    const sleepStartTime = now - 3 * 60 * 1000;
    const state = makeState({
      hunger: 80,
      isSleeping: true,
      sleepStartTime,
      lastUpdated: sleepStartTime,
    });
    const result = applyCrossSessionDecay(state);
    // Post-sleep elapsed = 1 minute = 60,000ms
    // hunger decay = floor(60,000 / 180,000) = 0
    expect(result.hunger).toBe(80);
  });
});
