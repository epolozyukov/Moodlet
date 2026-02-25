import type { PetState } from "./types";

const ALERT_COOLDOWN_MS = 600_000; // 10 minutes

export function shouldAlert(state: PetState): boolean {
  if (Date.now() - state.lastAlertTime < ALERT_COOLDOWN_MS) return false;
  return (
    state.hunger < 30 ||     // ≡ BL "hunger > 70"
    state.energy < 30 ||
    state.hygiene < 40 ||
    state.happiness < 40 ||
    state.isSick
  );
}
