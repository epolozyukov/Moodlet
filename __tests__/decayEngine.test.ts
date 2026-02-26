import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyCrossSessionDecay, applyTickDecay, DECAY_RATES } from "@/lib/decayEngine";
import { applyAction } from "@/lib/petEngine";
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

describe("DECAY_RATES", () => {
  it("hunger decays every 75s while awake", () => {
    expect(DECAY_RATES.hungerAwake).toBe(75_000);
  });

  it("hunger decays every 5min while sleeping", () => {
    expect(DECAY_RATES.hungerSleeping).toBe(300_000);
  });

  it("energy decays every 150s while awake", () => {
    expect(DECAY_RATES.energyAwake).toBe(150_000);
  });

  it("energy recovers every 33s while sleeping", () => {
    expect(DECAY_RATES.energySleeping).toBe(33_000);
  });

  it("happiness decays every 150s", () => {
    expect(DECAY_RATES.happiness).toBe(150_000);
  });

  it("hygiene decays every 100s", () => {
    expect(DECAY_RATES.hygiene).toBe(100_000);
  });

  it("health decays every 75s when conditions are bad", () => {
    expect(DECAY_RATES.health).toBe(75_000);
  });
});

describe("applyTickDecay (awake)", () => {
  it("does not decay stats when interval is shorter than decay rate", () => {
    const state = makeState();
    const result = applyTickDecay(state, 10_000);
    expect(result.hunger).toBe(80);
    expect(result.hygiene).toBe(80);
    expect(result.energy).toBe(80);
    expect(result.happiness).toBe(80);
  });

  it("decays hunger by 1 after exactly 75s awake", () => {
    expect(applyTickDecay(makeState({ hunger: 80 }), 75_000).hunger).toBe(79);
  });

  it("decays hygiene by 1 after exactly 100s awake", () => {
    expect(applyTickDecay(makeState({ hygiene: 80 }), 100_000).hygiene).toBe(79);
  });

  it("decays energy by 1 after exactly 150s awake", () => {
    expect(applyTickDecay(makeState({ energy: 80 }), 150_000).energy).toBe(79);
  });

  it("decays happiness by 1 after exactly 150s awake", () => {
    expect(applyTickDecay(makeState({ happiness: 80 }), 150_000).happiness).toBe(79);
  });

  it("does not decay below 0", () => {
    expect(applyTickDecay(makeState({ hunger: 0 }), 75_000).hunger).toBe(0);
  });

  it("decays multiple points for long elapsed time", () => {
    // 5min = 300,000ms → hunger: floor(300000/75000) = 4
    expect(applyTickDecay(makeState({ hunger: 80 }), 300_000).hunger).toBe(76);
  });
});

describe("applyTickDecay (sleeping)", () => {
  it("gains energy every 33s while sleeping", () => {
    const state = makeState({ isSleeping: true, sleepStartTime: Date.now() - 33_000, energy: 50 });
    const result = applyTickDecay(state, 33_000);
    expect(result.energy).toBe(51);
  });

  it("hunger still decays slowly while sleeping (every 5min)", () => {
    const state = makeState({ isSleeping: true, sleepStartTime: Date.now() - 300_000, hunger: 80 });
    const result = applyTickDecay(state, 300_000);
    expect(result.hunger).toBe(79);
  });

  it("hygiene does not decay while sleeping", () => {
    const state = makeState({ isSleeping: true, sleepStartTime: Date.now() - 100_000, hygiene: 80 });
    const result = applyTickDecay(state, 100_000);
    expect(result.hygiene).toBe(80);
  });

  it("does not exceed energy 100 while sleeping", () => {
    const state = makeState({ isSleeping: true, sleepStartTime: Date.now() - 33_000, energy: 99 });
    const result = applyTickDecay(state, 33_000);
    expect(result.energy).toBe(100);
  });
});

describe("applyTickDecay - health decay", () => {
  it("decays health when hunger is 0", () => {
    const state = makeState({ hunger: 0 });
    const result = applyTickDecay(state, 75_000);
    expect(result.health).toBeLessThan(100);
  });

  it("decays health when energy is 0", () => {
    const state = makeState({ energy: 0 });
    const result = applyTickDecay(state, 75_000);
    expect(result.health).toBeLessThan(100);
  });

  it("does not decay health in normal conditions", () => {
    const state = makeState();
    const result = applyTickDecay(state, 75_000);
    expect(result.health).toBe(100);
  });
});

describe("applyTickDecay - sickness tracking", () => {
  it("increments sicknessTicks when condition is active", () => {
    const state = makeState({ hygiene: 5 }); // sickness condition: hygiene < 15
    const result = applyTickDecay(state, 10_000);
    expect(result.sicknessTicks).toBeGreaterThan(0);
  });

  it("resets sicknessTicks when condition clears (and not yet sick)", () => {
    const state = makeState({ sicknessTicks: 2 }); // healthy state but had previous ticks
    const result = applyTickDecay(state, 10_000);
    expect(result.sicknessTicks).toBe(0);
  });

  it("sets isSick after 3 equivalent ticks of bad condition", () => {
    // 3+ equivalent ticks (elapsed > 3 * 300,000 = 900,000ms of 5-min ticks)
    const state = makeState({ hygiene: 5, sicknessTicks: 0 });
    const result = applyTickDecay(state, 1_000_000); // > 3 tick equivalents
    expect(result.isSick).toBe(true);
    expect(result.sicknessStart).not.toBeNull();
  });
});

describe("applyTickDecay - auto-sleep", () => {
  it("triggers sleep when energy is 15 or below", () => {
    const state = makeState({ energy: 15 });
    const result = applyTickDecay(state, 10_000);
    expect(result.isSleeping).toBe(true);
  });

  it("does not trigger sleep when energy is 16 or more (unless random)", () => {
    // Energy 16 is in the 20% random zone, use a high value to be safe
    const state = makeState({ energy: 50 });
    const result = applyTickDecay(state, 10_000);
    expect(result.isSleeping).toBe(false);
  });
});

describe("applyTickDecay - auto-wake", () => {
  it("auto-wakes pet at energy 90 without happiness penalty", () => {
    const state = makeState({ isSleeping: true, sleepStartTime: Date.now() - 33_000, energy: 89, happiness: 70 });
    const result = applyTickDecay(state, 33_000);
    expect(result.isSleeping).toBe(false);
    expect(result.happiness).toBe(70); // no penalty on natural wake
  });

  it("manual applyAction('wake') still applies -5 happiness penalty", () => {
    const state = makeState({ isSleeping: true, sleepStartTime: Date.now(), happiness: 70 });
    const result = applyAction(state, "wake");
    expect(result.happiness).toBe(65);
  });
});

describe("applyTickDecay - stage advancement", () => {
  it("advances from egg to baby after 1 hour", () => {
    const now = Date.now();
    const state = makeState({
      stage: "egg",
      stageStartTime: now - 3_700_000, // 1h 1m 40s ago
    });
    const result = applyTickDecay(state, 10_000);
    expect(result.stage).toBe("baby");
  });

  it("does not advance stage before time has elapsed", () => {
    const now = Date.now();
    const state = makeState({
      stage: "egg",
      stageStartTime: now - 1_800_000, // only 30 min ago
    });
    const result = applyTickDecay(state, 10_000);
    expect(result.stage).toBe("egg");
  });

  it("adult stage does not advance further", () => {
    const now = Date.now();
    const state = makeState({
      stage: "adult",
      stageStartTime: now - 400_000_000, // very long ago
    });
    const result = applyTickDecay(state, 10_000);
    expect(result.stage).toBe("adult");
  });
});

describe("applyTickDecay - death", () => {
  it("sets isDead when health reaches 0", () => {
    const state = makeState({ health: 0 });
    const result = applyTickDecay(state, 10_000);
    expect(result.isDead).toBe(true);
  });

  it("sets isDead when sick for more than 12 hours", () => {
    const state = makeState({
      isSick: true,
      sicknessStart: Date.now() - 13 * 3_600_000,
      health: 50,
    });
    const result = applyTickDecay(state, 10_000);
    expect(result.isDead).toBe(true);
  });

  it("does not set isDead for healthy state", () => {
    const result = applyTickDecay(makeState(), 10_000);
    expect(result.isDead).toBe(false);
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

  it("applies correct hunger decay after 30 minutes offline", () => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const state = makeState({ lastUpdated: thirtyMinutesAgo });
    vi.setSystemTime(Date.now());
    const result = applyCrossSessionDecay(state);
    // 30min = 1,800,000ms → hunger: floor(1800000/75000) = 24 points
    expect(result.hunger).toBe(56);
  });

  it("does not decay below 0 for large elapsed time", () => {
    const longAgo = Date.now() - 24 * 60 * 60 * 1000;
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

  it("keeps pet sleeping if energy has not recovered to 90", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const sleepStartTime = now - 1 * 60 * 1000; // 1 min of sleep
    const state = makeState({
      isSleeping: true,
      sleepStartTime,
      energy: 50, // would need many more minutes to reach 90
      lastUpdated: sleepStartTime,
    });
    const result = applyCrossSessionDecay(state);
    expect(result.isSleeping).toBe(true);
  });

  it("wakes pet when energy would have reached 90 during offline period", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    // Energy at 85 → needs 5 more points → 5 * 33,000ms = 165,000ms sleep
    // Set sleep start to 10 minutes ago (600,000ms) — well past wake threshold
    const sleepStartTime = now - 600_000;
    const state = makeState({
      isSleeping: true,
      sleepStartTime,
      energy: 85,
      lastUpdated: sleepStartTime,
    });
    const result = applyCrossSessionDecay(state);
    expect(result.isSleeping).toBe(false);
    expect(result.sleepStartTime).toBeNull();
  });

  it("sets isDead for neglect after 72 hours", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const state = makeState({ lastUpdated: now - 73 * 3_600_000 });
    const result = applyCrossSessionDecay(state);
    expect(result.isDead).toBe(true);
  });
});
