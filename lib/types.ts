export interface PetState {
  name: string;
  hunger: number;
  hygiene: number;
  energy: number;
  lastUpdated: number;
  isSleeping: boolean;
  sleepStartTime: number | null;
  firstOpenDate: string;
  lastVisitDate: string;
  currentStreak: number;
  chatHistory: ChatMessage[];
  lastUserAction: UserAction;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type MoodLabel = "happy" | "neutral" | "sad" | "critical";
export type UserAction = "feed" | "clean" | "sleep" | "wake" | "chat" | "none";

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
}
