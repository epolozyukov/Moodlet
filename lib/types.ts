export type PetStage = "egg" | "baby" | "child" | "teen" | "adult";

export interface PetState {
  name: string;
  hunger: number;               // 0-100, higher = fuller (better), starts 80
  hygiene: number;              // 0-100, starts 80
  energy: number;               // 0-100, starts 80
  happiness: number;            // 0-100, starts 80
  health: number;               // 0-100, starts 100
  lastUpdated: number;
  isSleeping: boolean;
  sleepStartTime: number | null;
  firstOpenDate: string;
  lastVisitDate: string;
  currentStreak: number;
  chatHistory: ChatMessage[];
  lastUserAction: UserAction;
  // Sickness tracking
  sicknessTicks: number;        // consecutive decay passes with sickness condition active
  isSick: boolean;              // set after 3 consecutive bad ticks
  sicknessStart: number | null; // Date.now() when isSick first became true
  // Death tracking
  hungerCriticalStart: number | null; // Date.now() when hunger hit 0
  isDead: boolean;
  // Growth
  stage: PetStage;
  stageStartTime: number;       // Date.now() when current stage began
  careScore: number;            // 0-100 rolling care quality for evolution
  // Alerts
  lastAlertTime: number;        // Date.now() of last attention alert
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type MoodLabel = "happy" | "neutral" | "sad" | "critical";
export type UserAction =
  | "meal"
  | "snack"
  | "clean"
  | "sleep"
  | "wake"
  | "chat"
  | "play"
  | "medicine"
  | "none";

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
}
