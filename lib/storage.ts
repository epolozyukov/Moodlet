import type { PetState } from "./types";

const STORAGE_KEY = "moodlet_pet";

export function loadPetState(): PetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PetState;
  } catch {
    return null;
  }
}

export function savePetState(state: PetState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDefaultPetState(name: string): PetState {
  const today = new Date().toISOString().split("T")[0];
  return {
    name,
    hunger: 80,
    hygiene: 80,
    energy: 80,
    lastUpdated: Date.now(),
    isSleeping: false,
    sleepStartTime: null,
    firstOpenDate: today,
    lastVisitDate: today,
    currentStreak: 1,
    chatHistory: [],
    lastUserAction: "none",
  };
}
