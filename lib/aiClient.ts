import type { PetState, ChatMessage } from "./types";

export class AIError extends Error {
  reason: "timeout" | "api_error" | "rate_limit";

  constructor(message: string, reason: "timeout" | "api_error" | "rate_limit") {
    super(message);
    this.name = "AIError";
    this.reason = reason;
  }
}

function getSessionId(): string {
  // Use localStorage so the same sessionId persists across tabs,
  // preventing rate limit bypass via multiple tab opens.
  const key = "moodlet_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

export async function sendChatMessage(
  userText: string,
  petState: PetState,
  chatHistory: ChatMessage[]
): Promise<string> {
  const messages: ChatMessage[] = [
    ...chatHistory,
    { role: "user", content: userText },
  ];

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      petState,
      sessionId: getSessionId(),
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new AIError("Rate limited", "rate_limit");
    }
    throw new AIError(`API error: ${response.status}`, "api_error");
  }

  const data = await response.json();
  return data.content as string;
}
