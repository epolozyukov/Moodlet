import { describe, it, expect } from "vitest";
import {
  computeMood,
  getMoodLabel,
  hasZeroStat,
  checkSicknessCondition,
  applyAction,
} from "@/lib/petEngine";
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

describe("computeMood", () => {
  it("returns happiness value directly", () => {
    expect(computeMood(makeState({ happiness: 75 }))).toBe(75);
  });

  it("returns 0 when happiness is 0", () => {
    expect(computeMood(makeState({ happiness: 0 }))).toBe(0);
  });

  it("returns 100 when happiness is 100", () => {
    expect(computeMood(makeState({ happiness: 100 }))).toBe(100);
  });
});

describe("getMoodLabel", () => {
  it("returns happy for 60-100", () => {
    expect(getMoodLabel(60)).toBe("happy");
    expect(getMoodLabel(100)).toBe("happy");
    expect(getMoodLabel(80)).toBe("happy");
  });

  it("returns neutral for 40-59", () => {
    expect(getMoodLabel(40)).toBe("neutral");
    expect(getMoodLabel(59)).toBe("neutral");
  });

  it("returns sad for 15-39", () => {
    expect(getMoodLabel(15)).toBe("sad");
    expect(getMoodLabel(39)).toBe("sad");
  });

  it("returns critical for 0-14", () => {
    expect(getMoodLabel(0)).toBe("critical");
    expect(getMoodLabel(14)).toBe("critical");
  });
});

describe("hasZeroStat", () => {
  it("returns false when all stats are above 0", () => {
    expect(hasZeroStat(makeState())).toBe(false);
  });

  it("returns true when hunger is 0", () => {
    expect(hasZeroStat(makeState({ hunger: 0 }))).toBe(true);
  });

  it("returns true when hygiene is 0", () => {
    expect(hasZeroStat(makeState({ hygiene: 0 }))).toBe(true);
  });

  it("returns true when energy is 0", () => {
    expect(hasZeroStat(makeState({ energy: 0 }))).toBe(true);
  });

  it("returns true when health is 0", () => {
    expect(hasZeroStat(makeState({ health: 0 }))).toBe(true);
  });
});

describe("checkSicknessCondition", () => {
  it("returns false for healthy state", () => {
    expect(checkSicknessCondition(makeState())).toBe(false);
  });

  it("returns true when hunger is below 10", () => {
    expect(checkSicknessCondition(makeState({ hunger: 9 }))).toBe(true);
  });

  it("returns true when hygiene is below 15", () => {
    expect(checkSicknessCondition(makeState({ hygiene: 14 }))).toBe(true);
  });

  it("returns true when energy is 0", () => {
    expect(checkSicknessCondition(makeState({ energy: 0 }))).toBe(true);
  });

  it("returns true when happiness is below 10", () => {
    expect(checkSicknessCondition(makeState({ happiness: 9 }))).toBe(true);
  });

  it("returns false when stats are exactly at threshold boundaries", () => {
    expect(
      checkSicknessCondition(makeState({ hunger: 10, hygiene: 15, energy: 1, happiness: 10 }))
    ).toBe(false);
  });
});

describe("applyAction - meal", () => {
  it("increases hunger by 35", () => {
    expect(applyAction(makeState({ hunger: 50 }), "meal").hunger).toBe(85);
  });

  it("caps hunger at 100", () => {
    expect(applyAction(makeState({ hunger: 80 }), "meal").hunger).toBe(100);
  });

  it("reduces hygiene by 8", () => {
    expect(applyAction(makeState({ hygiene: 80 }), "meal").hygiene).toBe(72);
  });

  it("increases happiness by 4 when not overfull", () => {
    expect(applyAction(makeState({ hunger: 50, happiness: 60 }), "meal").happiness).toBe(64);
  });

  it("applies overfeeding happiness penalty when hunger > 80", () => {
    // hunger 85 → overfed: happiness +4 + (-3) = net +1
    expect(applyAction(makeState({ hunger: 85, happiness: 60 }), "meal").happiness).toBe(61);
  });

  it("sets lastUserAction to meal", () => {
    expect(applyAction(makeState(), "meal").lastUserAction).toBe("meal");
  });
});

describe("applyAction - snack", () => {
  it("increases hunger by 15", () => {
    expect(applyAction(makeState({ hunger: 50 }), "snack").hunger).toBe(65);
  });

  it("increases happiness by 8", () => {
    expect(applyAction(makeState({ happiness: 60 }), "snack").happiness).toBe(68);
  });

  it("decreases health by 3", () => {
    expect(applyAction(makeState({ health: 100 }), "snack").health).toBe(97);
  });

  it("sets lastUserAction to snack", () => {
    expect(applyAction(makeState(), "snack").lastUserAction).toBe("snack");
  });
});

describe("applyAction - play", () => {
  it("increases happiness by 20", () => {
    expect(applyAction(makeState({ happiness: 50, energy: 50 }), "play").happiness).toBe(70);
  });

  it("decreases energy by 10", () => {
    expect(applyAction(makeState({ energy: 50 }), "play").energy).toBe(40);
  });

  it("decreases hunger by 6", () => {
    expect(applyAction(makeState({ hunger: 80, energy: 50 }), "play").hunger).toBe(74);
  });

  it("does nothing if energy is 20 or below", () => {
    const state = makeState({ energy: 20 });
    const result = applyAction(state, "play");
    expect(result.happiness).toBe(80);
    expect(result.lastUserAction).toBe("none");
  });

  it("does nothing if isSick is true", () => {
    expect(applyAction(makeState({ isSick: true, energy: 60 }), "play").happiness).toBe(80);
  });

  it("sets lastUserAction to play", () => {
    expect(applyAction(makeState({ energy: 50 }), "play").lastUserAction).toBe("play");
  });
});

describe("applyAction - clean", () => {
  it("sets hygiene to 100", () => {
    expect(applyAction(makeState({ hygiene: 40 }), "clean").hygiene).toBe(100);
  });

  it("increases happiness by 3", () => {
    expect(applyAction(makeState({ happiness: 60 }), "clean").happiness).toBe(63);
  });

  it("sets lastUserAction to clean", () => {
    expect(applyAction(makeState(), "clean").lastUserAction).toBe("clean");
  });
});

describe("applyAction - sleep", () => {
  it("sets isSleeping to true", () => {
    expect(applyAction(makeState(), "sleep").isSleeping).toBe(true);
  });

  it("sets sleepStartTime to a timestamp", () => {
    const before = Date.now();
    const result = applyAction(makeState(), "sleep");
    const after = Date.now();
    expect(result.sleepStartTime).toBeGreaterThanOrEqual(before);
    expect(result.sleepStartTime).toBeLessThanOrEqual(after);
  });

  it("sets lastUserAction to sleep", () => {
    expect(applyAction(makeState(), "sleep").lastUserAction).toBe("sleep");
  });
});

describe("applyAction - wake", () => {
  it("sets isSleeping to false", () => {
    expect(applyAction(makeState({ isSleeping: true, sleepStartTime: Date.now() }), "wake").isSleeping).toBe(false);
  });

  it("clears sleepStartTime", () => {
    expect(applyAction(makeState({ isSleeping: true, sleepStartTime: Date.now() }), "wake").sleepStartTime).toBeNull();
  });

  it("applies happiness -5 grumpy penalty", () => {
    expect(applyAction(makeState({ isSleeping: true, happiness: 80 }), "wake").happiness).toBe(75);
  });

  it("clamps happiness at 0 if already very low", () => {
    expect(applyAction(makeState({ isSleeping: true, happiness: 3 }), "wake").happiness).toBe(0);
  });

  it("sets lastUserAction to wake", () => {
    expect(applyAction(makeState({ isSleeping: true }), "wake").lastUserAction).toBe("wake");
  });
});

describe("applyAction - medicine", () => {
  it("increases health by 25", () => {
    expect(applyAction(makeState({ health: 50, isSick: true }), "medicine").health).toBe(75);
  });

  it("caps health at 100", () => {
    expect(applyAction(makeState({ health: 90, isSick: true }), "medicine").health).toBe(100);
  });

  it("clears isSick flag", () => {
    expect(applyAction(makeState({ isSick: true }), "medicine").isSick).toBe(false);
  });

  it("resets sicknessTicks to 0", () => {
    expect(applyAction(makeState({ isSick: true, sicknessTicks: 5 }), "medicine").sicknessTicks).toBe(0);
  });

  it("clears sicknessStart", () => {
    expect(
      applyAction(makeState({ isSick: true, sicknessStart: Date.now() - 60000 }), "medicine").sicknessStart
    ).toBeNull();
  });

  it("applies happiness -2 penalty", () => {
    expect(applyAction(makeState({ happiness: 70, isSick: true }), "medicine").happiness).toBe(68);
  });

  it("sets lastUserAction to medicine", () => {
    expect(applyAction(makeState({ isSick: true }), "medicine").lastUserAction).toBe("medicine");
  });
});

describe("applyAction - chat", () => {
  it("sets lastUserAction to chat", () => {
    expect(applyAction(makeState(), "chat").lastUserAction).toBe("chat");
  });

  it("does not change stats", () => {
    const state = makeState({ hunger: 60, hygiene: 70, energy: 80, happiness: 50 });
    const result = applyAction(state, "chat");
    expect(result.hunger).toBe(60);
    expect(result.hygiene).toBe(70);
    expect(result.energy).toBe(80);
    expect(result.happiness).toBe(50);
  });
});
