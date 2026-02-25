import { describe, it, expect } from "vitest";
import {
  computeMood,
  getMoodLabel,
  isSick,
  canExitSick,
  applyAction,
} from "@/lib/petEngine";
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

describe("computeMood", () => {
  it("returns average of hunger, hygiene, energy", () => {
    const state = makeState({ hunger: 90, hygiene: 60, energy: 90 });
    expect(computeMood(state)).toBe(80);
  });

  it("returns 0 when all stats are 0", () => {
    const state = makeState({ hunger: 0, hygiene: 0, energy: 0 });
    expect(computeMood(state)).toBe(0);
  });

  it("returns 100 when all stats are 100", () => {
    const state = makeState({ hunger: 100, hygiene: 100, energy: 100 });
    expect(computeMood(state)).toBe(100);
  });

  it("rounds down to nearest integer", () => {
    const state = makeState({ hunger: 100, hygiene: 100, energy: 99 });
    expect(computeMood(state)).toBe(99);
  });
});

describe("getMoodLabel", () => {
  it("returns happy for 80-100", () => {
    expect(getMoodLabel(80)).toBe("happy");
    expect(getMoodLabel(100)).toBe("happy");
    expect(getMoodLabel(95)).toBe("happy");
  });

  it("returns neutral for 50-79", () => {
    expect(getMoodLabel(50)).toBe("neutral");
    expect(getMoodLabel(79)).toBe("neutral");
  });

  it("returns sad for 20-49", () => {
    expect(getMoodLabel(20)).toBe("sad");
    expect(getMoodLabel(49)).toBe("sad");
  });

  it("returns critical for 0-19", () => {
    expect(getMoodLabel(0)).toBe("critical");
    expect(getMoodLabel(19)).toBe("critical");
  });
});

describe("isSick", () => {
  it("returns false when all stats are above 0", () => {
    expect(isSick(makeState())).toBe(false);
  });

  it("returns true when hunger is 0", () => {
    expect(isSick(makeState({ hunger: 0 }))).toBe(true);
  });

  it("returns true when hygiene is 0", () => {
    expect(isSick(makeState({ hygiene: 0 }))).toBe(true);
  });

  it("returns true when energy is 0", () => {
    expect(isSick(makeState({ energy: 0 }))).toBe(true);
  });
});

describe("canExitSick", () => {
  it("returns true when all stats are >= 30", () => {
    expect(canExitSick(makeState({ hunger: 30, hygiene: 30, energy: 30 }))).toBe(true);
    expect(canExitSick(makeState({ hunger: 80, hygiene: 80, energy: 80 }))).toBe(true);
  });

  it("returns false when any stat is below 30", () => {
    expect(canExitSick(makeState({ hunger: 29 }))).toBe(false);
    expect(canExitSick(makeState({ hygiene: 0 }))).toBe(false);
    expect(canExitSick(makeState({ energy: 10 }))).toBe(false);
  });
});

describe("applyAction - feed", () => {
  it("increases hunger by 25", () => {
    const result = applyAction(makeState({ hunger: 50 }), "feed");
    expect(result.hunger).toBe(75);
  });

  it("caps hunger at 100", () => {
    const result = applyAction(makeState({ hunger: 90 }), "feed");
    expect(result.hunger).toBe(100);
  });

  it("sets lastUserAction to feed", () => {
    const result = applyAction(makeState(), "feed");
    expect(result.lastUserAction).toBe("feed");
  });
});

describe("applyAction - clean", () => {
  it("increases hygiene by 30", () => {
    const result = applyAction(makeState({ hygiene: 50 }), "clean");
    expect(result.hygiene).toBe(80);
  });

  it("caps hygiene at 100", () => {
    const result = applyAction(makeState({ hygiene: 80 }), "clean");
    expect(result.hygiene).toBe(100);
  });

  it("sets lastUserAction to clean", () => {
    const result = applyAction(makeState(), "clean");
    expect(result.lastUserAction).toBe("clean");
  });
});

describe("applyAction - sleep", () => {
  it("increases energy by 40", () => {
    const result = applyAction(makeState({ energy: 50 }), "sleep");
    expect(result.energy).toBe(90);
  });

  it("caps energy at 100", () => {
    const result = applyAction(makeState({ energy: 80 }), "sleep");
    expect(result.energy).toBe(100);
  });

  it("sets isSleeping to true", () => {
    const result = applyAction(makeState(), "sleep");
    expect(result.isSleeping).toBe(true);
  });

  it("sets sleepStartTime to a timestamp", () => {
    const before = Date.now();
    const result = applyAction(makeState(), "sleep");
    const after = Date.now();
    expect(result.sleepStartTime).toBeGreaterThanOrEqual(before);
    expect(result.sleepStartTime).toBeLessThanOrEqual(after);
  });

  it("sets lastUserAction to sleep", () => {
    const result = applyAction(makeState(), "sleep");
    expect(result.lastUserAction).toBe("sleep");
  });
});

describe("applyAction - wake", () => {
  it("sets isSleeping to false", () => {
    const sleeping = makeState({ isSleeping: true, sleepStartTime: Date.now() });
    const result = applyAction(sleeping, "wake");
    expect(result.isSleeping).toBe(false);
  });

  it("clears sleepStartTime", () => {
    const sleeping = makeState({ isSleeping: true, sleepStartTime: Date.now() });
    const result = applyAction(sleeping, "wake");
    expect(result.sleepStartTime).toBeNull();
  });
});

describe("applyAction - chat", () => {
  it("sets lastUserAction to chat", () => {
    const result = applyAction(makeState(), "chat");
    expect(result.lastUserAction).toBe("chat");
  });

  it("does not change stats", () => {
    const state = makeState({ hunger: 60, hygiene: 70, energy: 80 });
    const result = applyAction(state, "chat");
    expect(result.hunger).toBe(60);
    expect(result.hygiene).toBe(70);
    expect(result.energy).toBe(80);
  });
});
