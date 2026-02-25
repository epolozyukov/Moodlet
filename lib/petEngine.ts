import type { PetState, MoodLabel, UserAction } from "./types";

export function computeMood(state: PetState): number {
  return Math.floor((state.hunger + state.hygiene + state.energy) / 3);
}

export function getMoodLabel(mood: number): MoodLabel {
  if (mood >= 80) return "happy";
  if (mood >= 50) return "neutral";
  if (mood >= 20) return "sad";
  return "critical";
}

export function isSick(state: PetState): boolean {
  return state.hunger === 0 || state.hygiene === 0 || state.energy === 0;
}

export function canExitSick(state: PetState): boolean {
  return state.hunger >= 30 && state.hygiene >= 30 && state.energy >= 30;
}

export function applyAction(state: PetState, action: UserAction): PetState {
  switch (action) {
    case "feed":
      return {
        ...state,
        hunger: Math.min(100, state.hunger + 25),
        lastUserAction: "feed",
      };
    case "clean":
      return {
        ...state,
        hygiene: Math.min(100, state.hygiene + 30),
        lastUserAction: "clean",
      };
    case "sleep":
      return {
        ...state,
        energy: Math.min(100, state.energy + 40),
        isSleeping: true,
        sleepStartTime: Date.now(),
        lastUserAction: "sleep",
      };
    case "wake":
      return {
        ...state,
        isSleeping: false,
        sleepStartTime: null,
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
