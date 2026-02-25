import type { PetState, MoodLabel, UserAction } from "./types";

// computeMood is now based directly on happiness stat
export function computeMood(state: PetState): number {
  return state.happiness;
}

export function getMoodLabel(mood: number): MoodLabel {
  if (mood >= 60) return "happy";
  if (mood >= 40) return "neutral";
  if (mood >= 15) return "sad";
  return "critical";
}

// True if any stat is at 0 (used for legacy checks / UI fallback)
export function hasZeroStat(state: PetState): boolean {
  return state.hunger === 0 || state.hygiene === 0 || state.energy === 0 || state.health === 0;
}

// Returns true if the current state meets any sickness-triggering condition
export function checkSicknessCondition(state: PetState): boolean {
  return (
    state.hunger < 10 ||       // ≡ BL "hunger > 90" (our hunger is inverted)
    state.hygiene < 15 ||
    state.energy === 0 ||
    state.happiness < 10
  );
}

export function applyAction(state: PetState, action: UserAction): PetState {
  switch (action) {
    case "meal": {
      const overfed = state.hunger > 80;
      return {
        ...state,
        hunger: Math.min(100, state.hunger + 35),
        hygiene: Math.max(0, state.hygiene - 8),
        happiness: Math.min(100, state.happiness + 4 + (overfed ? -3 : 0)),
        lastUserAction: "meal",
      };
    }
    case "snack":
      return {
        ...state,
        hunger: Math.min(100, state.hunger + 15),
        happiness: Math.min(100, state.happiness + 8),
        health: Math.max(0, state.health - 3),
        lastUserAction: "snack",
      };
    case "play":
      // Only allowed if energy > 20 and not sick
      if (state.energy <= 20 || state.isSick) return state;
      return {
        ...state,
        happiness: Math.min(100, state.happiness + 20),
        energy: Math.max(0, state.energy - 10),
        hunger: Math.max(0, state.hunger - 6),
        lastUserAction: "play",
      };
    case "clean":
      return {
        ...state,
        hygiene: 100,
        happiness: Math.min(100, state.happiness + 3),
        lastUserAction: "clean",
      };
    case "sleep":
      return {
        ...state,
        isSleeping: true,
        sleepStartTime: Date.now(),
        lastUserAction: "sleep",
      };
    case "wake":
      return {
        ...state,
        isSleeping: false,
        sleepStartTime: null,
        happiness: Math.max(0, state.happiness - 5), // grumpy penalty
        lastUserAction: "wake",
      };
    case "medicine":
      return {
        ...state,
        health: Math.min(100, state.health + 25),
        isSick: false,
        sicknessTicks: 0,
        sicknessStart: null,
        happiness: Math.max(0, state.happiness - 2),
        lastUserAction: "medicine",
      };
    case "chat":
      return {
        ...state,
        lastUserAction: "chat",
      };
    default:
      return state;
  }
}
