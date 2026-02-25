import type { PetState, MoodLabel } from "./types";

export function getFallbackMessage(state: PetState, moodLabel: MoodLabel): string {
  if (state.isSick) {
    return "...help.";
  }

  if (state.energy <= 15) {
    return "...zzz. Too tired to talk right now.";
  }

  if (state.hunger <= 15) {
    return "Too hungry to think. Feed me first?";
  }

  if (state.hygiene <= 15) {
    return "I feel gross. Can you clean me first?";
  }

  switch (moodLabel) {
    case "happy":
      return "Hmm? Oh, sorry, I got distracted.";
    case "neutral":
      return "*grumbles* My thoughts are all scrambled right now.";
    case "sad":
      return "I'm not feeling great. Give me a moment.";
    case "critical":
      return "...not now. Please take care of me first.";
    default:
      return "*grumbles* My thoughts are all scrambled right now.";
  }
}
