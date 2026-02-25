import type { MoodLabel, PetStage } from "@/lib/types";

interface PetSpriteProps {
  moodLabel: MoodLabel;
  isSick: boolean;
  isSleeping: boolean;
  stage: PetStage;
  isAlert?: boolean;
  isActing?: boolean;
}

type PetStateKey = "happy" | "neutral" | "sad" | "critical" | "sick" | "sleeping";

// Per-stage emoji sets for each mood state
const STAGE_SPRITES: Record<PetStage, Record<PetStateKey, string>> = {
  egg:   { happy: "🥚", neutral: "🥚", sad: "🥚", critical: "🥚", sick: "🤒", sleeping: "💤" },
  baby:  { happy: "🐣", neutral: "🐣", sad: "🐣", critical: "🐣", sick: "🤒", sleeping: "💤" },
  child: { happy: "🐣", neutral: "🐥", sad: "🐤", critical: "🐧", sick: "🤒", sleeping: "💤" },
  teen:  { happy: "🐥", neutral: "🐤", sad: "🐧", critical: "🐧", sick: "🤒", sleeping: "💤" },
  adult: { happy: "🐧", neutral: "🐧", sad: "🐧", critical: "🐧", sick: "🤒", sleeping: "💤" },
};

const SPRITE_LABELS: Record<PetStateKey, string> = {
  happy: "happy pet",
  neutral: "neutral pet",
  sad: "sad pet",
  critical: "critical pet",
  sick: "sick pet",
  sleeping: "sleeping pet",
};

const STATE_CLASSES: Record<PetStateKey, string> = {
  happy: "border-gb-screen animate-none",
  neutral: "border-gb-mid",
  sad: "border-gb-mid opacity-75",
  critical: "border-gray-400 grayscale",
  sick: "border-red-500 animate-shake",
  sleeping: "border-gb-dark animate-pulse_slow",
};

export default function PetSprite({
  moodLabel,
  isSick,
  isSleeping,
  stage,
  isAlert = false,
  isActing = false,
}: PetSpriteProps) {
  const state: PetStateKey = isSick
    ? "sick"
    : isSleeping
    ? "sleeping"
    : moodLabel;

  const emoji = STAGE_SPRITES[stage][state];
  const label = SPRITE_LABELS[state];
  const showBounce = isActing && !isSick && !isSleeping;

  return (
    <div
      data-pet-state={state}
      data-stage={stage}
      className={`flex items-center justify-center w-32 h-32 border-4 shadow-pixel bg-gb-light ${
        STATE_CLASSES[state]
      } ${isAlert ? "animate-pulse" : ""} ${showBounce ? "animate-bounce-action" : ""}`}
      role="img"
      aria-label={label}
    >
      <span className="text-6xl select-none">{emoji}</span>
    </div>
  );
}
