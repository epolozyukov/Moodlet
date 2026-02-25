import type { PetState, PetStage } from "./types";
import { applyAction, checkSicknessCondition } from "./petEngine";

// Rates: ms per 1 point of change (based on BL per-5-min rates)
export const DECAY_RATES = {
  hungerAwake:    75_000,  // -4 per 5min → -1 per 75s
  hungerSleeping: 300_000, // -1 per 5min → -1 per 300s
  energyAwake:    100_000, // -3 per 5min → -1 per 100s
  energySleeping: 50_000,  // +6 per 5min → +1 per 50s (energy gain while sleeping)
  happiness:      150_000, // -2 per 5min → -1 per 150s
  hygiene:        100_000, // -3 per 5min → -1 per 100s
  health:         75_000,  // -4 per 5min → -1 per 75s (conditional)
} as const;

// Stage advancement durations in ms
const STAGE_DURATIONS: Record<PetStage, number | null> = {
  egg:   3_600_000,    // 1 hour
  baby:  86_400_000,   // 24 hours
  child: 172_800_000,  // 48 hours
  teen:  259_200_000,  // 72 hours
  adult: null,         // no further advancement
};

const STAGE_ORDER: PetStage[] = ["egg", "baby", "child", "teen", "adult"];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function decayStat(current: number, elapsed: number, rateMs: number): number {
  return clamp(current - Math.floor(elapsed / rateMs));
}

function gainStat(current: number, elapsed: number, rateMs: number): number {
  return clamp(current + Math.floor(elapsed / rateMs));
}

function advanceStage(state: PetState, now: number): PetState {
  const duration = STAGE_DURATIONS[state.stage];
  if (duration === null) return state;
  if (now - state.stageStartTime < duration) return state;

  const currentIndex = STAGE_ORDER.indexOf(state.stage);
  const nextStage = STAGE_ORDER[currentIndex + 1];
  if (!nextStage) return state;

  return { ...state, stage: nextStage, stageStartTime: now };
}

function updateCareScore(state: PetState): number {
  const tickScore =
    ((state.hunger >= 40 ? 1 : 0) +
      (state.happiness > 50 ? 1 : 0) +
      (state.hygiene > 50 ? 1 : 0) +
      (!state.isSick ? 1 : 0)) /
    4;
  return clamp(state.careScore * 0.9 + tickScore * 10);
}

function checkDeath(state: PetState, now: number): boolean {
  if (state.health === 0) return true;
  if (
    state.isSick &&
    state.sicknessStart !== null &&
    now - state.sicknessStart > 43_200_000
  )
    return true; // sick > 12 hours
  if (
    state.hungerCriticalStart !== null &&
    now - state.hungerCriticalStart > 1_800_000
  )
    return true; // hunger=0 > 30 min
  if (now - state.lastUpdated > 259_200_000) return true; // neglect > 72 hours
  return false;
}

/**
 * Core decay logic applied to a state for a given elapsed time window.
 * Handles sleeping/awake modes, happiness penalties, health decay,
 * sickness tracking, auto-sleep, wake condition, care score, stage, and death.
 */
function applyDecay(state: PetState, elapsedMs: number, now: number): PetState {
  let s = { ...state };

  if (s.isSleeping) {
    // Sleeping: energy recovers, hunger still drops slowly, happiness drops slowly
    s.energy = gainStat(s.energy, elapsedMs, DECAY_RATES.energySleeping);
    s.hunger = decayStat(s.hunger, elapsedMs, DECAY_RATES.hungerSleeping);
    s.happiness = decayStat(s.happiness, elapsedMs, DECAY_RATES.happiness);
  } else {
    // Awake decay
    s.hunger = decayStat(s.hunger, elapsedMs, DECAY_RATES.hungerAwake);
    s.energy = decayStat(s.energy, elapsedMs, DECAY_RATES.energyAwake);
    s.happiness = decayStat(s.happiness, elapsedMs, DECAY_RATES.happiness);
    s.hygiene = decayStat(s.hygiene, elapsedMs, DECAY_RATES.hygiene);
  }

  // Happiness penalty: hungry (< 20 fullness) or dirty
  if (s.hunger < 20) {
    s.happiness = decayStat(s.happiness, elapsedMs, DECAY_RATES.happiness);
  }
  if (s.hygiene < 30) {
    s.happiness = decayStat(s.happiness, elapsedMs, DECAY_RATES.happiness);
  }

  // Health decay when conditions are bad
  const healthDecayActive =
    s.hunger === 0 || s.hygiene < 20 || s.energy === 0 || s.isSick;
  if (healthDecayActive) {
    s.health = decayStat(s.health, elapsedMs, DECAY_RATES.health);
  }

  // Sickness tracking (count discrete ticks using ~5-min equivalents)
  const tickEquivalents = Math.max(1, Math.round(elapsedMs / 300_000));
  if (checkSicknessCondition(s)) {
    s.sicknessTicks = s.sicknessTicks + tickEquivalents;
    if (s.sicknessTicks >= 3 && !s.isSick) {
      s.isSick = true;
      s.sicknessStart = now;
    }
  } else if (!s.isSick) {
    s.sicknessTicks = 0;
  }

  // Extra decay when actively sick
  if (s.isSick) {
    s.happiness = decayStat(s.happiness, elapsedMs, 100_000); // -3/5min extra
    s.health = decayStat(s.health, elapsedMs, DECAY_RATES.health); // -4/5min extra
  }

  // Hunger critical tracking (starvation clock)
  if (s.hunger === 0) {
    if (s.hungerCriticalStart === null) s.hungerCriticalStart = now;
  } else {
    s.hungerCriticalStart = null;
  }

  // Auto-sleep trigger (only when awake)
  if (!s.isSleeping) {
    if (s.energy <= 15) {
      s = applyAction(s, "sleep");
      s.happiness = Math.max(0, s.happiness); // no grumpy penalty for auto-sleep
    } else if (s.energy < 30 && Math.random() < 0.2) {
      s = applyAction(s, "sleep");
    }
  }

  // Wake condition: energy has recovered enough
  if (s.isSleeping && s.energy >= 90) {
    s = applyAction(s, "wake");
  }

  // Care score update
  s.careScore = updateCareScore(s);

  // Stage advancement
  s = advanceStage(s, now);

  // Death check
  if (!s.isDead && checkDeath(s, now)) {
    s.isDead = true;
  }

  return s;
}

export function applyTickDecay(state: PetState, elapsedMs: number): PetState {
  const now = Date.now();
  const s = applyDecay(state, elapsedMs, now);
  return { ...s, lastUpdated: now };
}

export function applyCrossSessionDecay(state: PetState): PetState {
  const now = Date.now();

  // Handle sleeping state resolution across sessions
  if (state.isSleeping && state.sleepStartTime !== null) {
    const sleepElapsed = now - state.sleepStartTime;

    // Check if energy would have hit 90 during sleep
    const energyGain = Math.floor(sleepElapsed / DECAY_RATES.energySleeping);
    const projectedEnergy = Math.min(100, state.energy + energyGain);

    if (projectedEnergy < 90) {
      // Still sleeping: apply sleeping decay only
      const s = applyDecay(state, sleepElapsed, now);
      return { ...s, lastUpdated: now };
    }

    // Pet would have woken during the session gap
    const msToReach90 =
      Math.max(0, 90 - state.energy) * DECAY_RATES.energySleeping;
    const wokeAt = state.sleepStartTime + msToReach90;
    const postSleepElapsed = now - wokeAt;

    // Apply sleep decay up to wake point, then wake, then awake decay
    const sleepingState = applyDecay(state, msToReach90, wokeAt);
    const wokeState = applyAction(sleepingState, "wake");
    const s = applyDecay(wokeState, postSleepElapsed, now);
    return { ...s, lastUpdated: now };
  }

  // Normal awake cross-session decay
  const elapsed = now - state.lastUpdated;
  const s = applyDecay(state, elapsed, now);
  return { ...s, lastUpdated: now };
}
