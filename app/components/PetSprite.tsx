import type { MoodLabel } from "@/lib/types";

interface PetSpriteProps {
  moodLabel: MoodLabel;
  isSick: boolean;
  isSleeping: boolean;
}

type PetStateKey = "happy" | "neutral" | "sad" | "critical" | "sick" | "sleeping";

const SPRITES: Record<PetStateKey, { emoji: string; label: string }> = {
  happy: { emoji: "🐣", label: "happy pet" },
  neutral: { emoji: "🐥", label: "neutral pet" },
  sad: { emoji: "🐤", label: "sad pet" },
  critical: { emoji: "🐧", label: "critical pet" },
  sick: { emoji: "🤒", label: "sick pet" },
  sleeping: { emoji: "💤", label: "sleeping pet" },
};

const STATE_CLASSES: Record<PetStateKey, string> = {
  happy: "border-gb-screen animate-none",
  neutral: "border-gb-mid",
  sad: "border-gb-mid opacity-75",
  critical: "border-gray-400 grayscale",
  sick: "border-red-500 animate-shake",
  sleeping: "border-gb-dark animate-pulse_slow",
};

export default function PetSprite({ moodLabel, isSick, isSleeping }: PetSpriteProps) {
  const state: PetStateKey = isSick
    ? "sick"
    : isSleeping
    ? "sleeping"
    : moodLabel;

  const { emoji, label } = SPRITES[state];

  return (
    <div
      data-pet-state={state}
      className={`flex items-center justify-center w-32 h-32 border-4 shadow-pixel bg-gb-light ${STATE_CLASSES[state]}`}
      role="img"
      aria-label={label}
    >
      <span className="text-6xl select-none">{emoji}</span>
    </div>
  );
}
