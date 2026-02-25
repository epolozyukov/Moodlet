import type { PetState } from "./types";

const STORAGE_KEY = "moodlet_pet";

export function getDefaultPetState(name: string): PetState {
  const today = new Date().toISOString().split("T")[0];
  const now = Date.now();
  return {
    name,
    hunger: 80,
    hygiene: 80,
    energy: 80,
    happiness: 80,
    health: 100,
    lastUpdated: now,
    isSleeping: false,
    sleepStartTime: null,
    firstOpenDate: today,
    lastVisitDate: today,
    currentStreak: 1,
    chatHistory: [],
    lastUserAction: "none",
    sicknessTicks: 0,
    isSick: false,
    sicknessStart: null,
    hungerCriticalStart: null,
    isDead: false,
    stage: "egg",
    stageStartTime: now,
    careScore: 80,
    lastAlertTime: 0,
  };
}

export function loadPetState(): PetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const loaded = JSON.parse(raw) as Partial<PetState> & { name: string };
    // Merge with defaults to migrate old saves missing new fields
    return { ...getDefaultPetState(loaded.name), ...loaded };
  } catch {
    return null;
  }
}

export function savePetState(state: PetState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
