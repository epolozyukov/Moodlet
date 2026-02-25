import { NextResponse } from "next/server";
import type { PetState, ChatMessage, MoodLabel } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { getFallbackMessage } from "@/lib/fallbackMessages";
import { computeMood, getMoodLabel } from "@/lib/petEngine";
import { isAllowed, recordRequest } from "@/lib/rateLimiter";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama3-8b-8192";
const TIMEOUT_MS = 10_000;

const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES = 12; // 1 system + 5 exchanges = 11, a little headroom

async function callGroq(
  model: string,
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 80,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  } finally {
    clearTimeout(timer);
  }
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages)) return false;
  if (messages.length > MAX_MESSAGES) return false;
  return messages.every(
    (m) =>
      m !== null &&
      typeof m === "object" &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.length <= MAX_MESSAGE_LENGTH
  );
}

function validateSessionId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 128;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: {
    messages?: unknown;
    petState?: PetState;
    sessionId?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, petState, sessionId } = body;

  if (!validateSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  if (!petState || typeof petState !== "object") {
    return NextResponse.json({ error: "Invalid petState" }, { status: 400 });
  }

  if (!validateMessages(messages)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  // Rate limiting — check without recording first to return proper 429
  if (!isAllowed(sessionId)) {
    const mood = getMoodLabel(computeMood(petState));
    const fallback = getFallbackMessage(petState, mood);
    return NextResponse.json({ content: fallback }, { status: 429 });
  }

  recordRequest(sessionId);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const mood = getMoodLabel(computeMood(petState));
    return NextResponse.json(
      { content: getFallbackMessage(petState, mood) },
      { status: 200 }
    );
  }

  const mood: MoodLabel = getMoodLabel(computeMood(petState));
  const systemPrompt = buildSystemPrompt(petState, mood);

  const fullMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const content = await callGroq(PRIMARY_MODEL, fullMessages as ChatMessage[], apiKey);
    return NextResponse.json({ content });
  } catch {
    try {
      const content = await callGroq(FALLBACK_MODEL, fullMessages as ChatMessage[], apiKey);
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ content: getFallbackMessage(petState, mood) });
    }
  }
}
