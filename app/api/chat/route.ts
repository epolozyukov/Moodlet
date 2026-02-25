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
const MAX_RESPONSE_CHARS = 900;

const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES = 12; // 1 system + 5 exchanges = 11, a little headroom

export function sanitizePetState(raw: PetState): PetState {
  function clamp(val: unknown, def: number): number {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : def;
  }
  return {
    ...raw,
    name: ((raw.name ?? "Pet").replace(/[^a-zA-Z0-9 '\-]/g, "").slice(0, 32)) || "Pet",
    hunger:    clamp(raw.hunger, 0),
    hygiene:   clamp(raw.hygiene, 0),
    energy:    clamp(raw.energy, 0),
    happiness: clamp(raw.happiness, 0),
    health:    clamp(raw.health, 100),
  };
}

function trimResponse(text: string): string {
  if (text.length <= MAX_RESPONSE_CHARS) return text;
  const cut = text.slice(0, MAX_RESPONSE_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

function getTemperature(energy: number): number {
  return energy < 30 ? 1.1 : 0.8;
}

async function callGroq(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  temperature: number
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
        temperature,
        max_tokens: 250,
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

  // Sanitize user-supplied petState before using in system prompt
  const safePetState = sanitizePetState(petState);

  // Rate limiting — check without recording first to return proper 429
  if (!isAllowed(sessionId)) {
    const mood = getMoodLabel(computeMood(safePetState));
    const fallback = getFallbackMessage(safePetState, mood);
    return NextResponse.json({ content: fallback }, { status: 429 });
  }

  recordRequest(sessionId);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const mood = getMoodLabel(computeMood(safePetState));
    return NextResponse.json(
      { content: getFallbackMessage(safePetState, mood) },
      { status: 200 }
    );
  }

  const mood: MoodLabel = getMoodLabel(computeMood(safePetState));
  const systemPrompt = buildSystemPrompt(safePetState, mood);
  const temperature = getTemperature(safePetState.energy);

  const fullMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const content = await callGroq(PRIMARY_MODEL, fullMessages as ChatMessage[], apiKey, temperature);
    return NextResponse.json({ content: trimResponse(content) });
  } catch {
    try {
      const content = await callGroq(FALLBACK_MODEL, fullMessages as ChatMessage[], apiKey, temperature);
      return NextResponse.json({ content: trimResponse(content) });
    } catch {
      return NextResponse.json({ content: getFallbackMessage(safePetState, mood) });
    }
  }
}
