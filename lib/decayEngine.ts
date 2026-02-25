import type { PetState } from "./types";
import { applyAction } from "./petEngine";

export const DECAY_RATES = {
  hunger: 180_000,  // 3 minutes per point
  hygiene: 300_000, // 5 minutes per point
  energy: 240_000,  // 4 minutes per point
} as const;

const SLEEP_DURATION_MS = 120_000; // 2 minutes

function decayStat(current: number, elapsed: number, rateMs: number): number {
  return Math.max(0, current - Math.floor(elapsed / rateMs));
}

export function applyTickDecay(state: PetState, elapsedMs: number): PetState {
  if (state.isSleeping) return state;

  return {
    ...state,
    hunger: decayStat(state.hunger, elapsedMs, DECAY_RATES.hunger),
    hygiene: decayStat(state.hygiene, elapsedMs, DECAY_RATES.hygiene),
    energy: decayStat(state.energy, elapsedMs, DECAY_RATES.energy),
  };
}

export function applyCrossSessionDecay(state: PetState): PetState {
  const now = Date.now();

  // Handle sleeping state resolution
  if (state.isSleeping && state.sleepStartTime !== null) {
    const sleepElapsed = now - state.sleepStartTime;

    if (sleepElapsed < SLEEP_DURATION_MS) {
      // Still sleeping, no decay, just update timestamp
      return { ...state, lastUpdated: now };
    }

    // Sleep has ended: wake the pet
    const wokeAt = state.sleepStartTime + SLEEP_DURATION_MS;
    const postSleepElapsed = now - wokeAt;
    const wokeState = applyAction(state, "wake");

    return {
      ...wokeState,
      hunger: decayStat(wokeState.hunger, postSleepElapsed, DECAY_RATES.hunger),
      hygiene: decayStat(wokeState.hygiene, postSleepElapsed, DECAY_RATES.hygiene),
      energy: decayStat(wokeState.energy, postSleepElapsed, DECAY_RATES.energy),
      lastUpdated: now,
    };
  }

  // Normal (awake) cross-session decay
  const elapsed = now - state.lastUpdated;

  return {
    ...state,
    hunger: decayStat(state.hunger, elapsed, DECAY_RATES.hunger),
    hygiene: decayStat(state.hygiene, elapsed, DECAY_RATES.hygiene),
    energy: decayStat(state.energy, elapsed, DECAY_RATES.energy),
    lastUpdated: now,
  };
}
