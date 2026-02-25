import type { PetState } from "./types";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function updateStreak(state: PetState): PetState {
  const today = getToday();

  if (state.lastVisitDate === today) {
    // Already counted today
    return state;
  }

  const yesterday = getYesterday();

  if (state.lastVisitDate === yesterday) {
    // Consecutive day — extend streak
    return {
      ...state,
      currentStreak: state.currentStreak + 1,
      lastVisitDate: today,
    };
  }

  // Missed a day or more — reset streak
  return {
    ...state,
    currentStreak: 1,
    lastVisitDate: today,
  };
}
