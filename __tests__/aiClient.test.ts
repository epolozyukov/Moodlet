import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendChatMessage } from "@/lib/aiClient";
import type { PetState, ChatMessage } from "@/lib/types";

const makeState = (overrides: Partial<PetState> = {}): PetState => ({
  name: "Bubbles",
  hunger: 80,
  hygiene: 80,
  energy: 80,
  happiness: 80,
  health: 100,
  lastUpdated: Date.now(),
  isSleeping: false,
  sleepStartTime: null,
  firstOpenDate: "2026-01-01",
  lastVisitDate: "2026-01-01",
  currentStreak: 1,
  chatHistory: [],
  lastUserAction: "none",
  sicknessTicks: 0,
  isSick: false,
  sicknessStart: null,
  hungerCriticalStart: null,
  isDead: false,
  stage: "child",
  stageStartTime: Date.now(),
  careScore: 80,
  lastAlertTime: 0,
  ...overrides,
});

describe("sendChatMessage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns AI response content on success", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "Hello, I am hungry!" }),
    } as Response);

    const result = await sendChatMessage("Hi", makeState(), []);
    expect(result).toBe("Hello, I am hungry!");
  });

  it("calls /api/chat endpoint", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "Hi there!" }),
    } as Response);

    await sendChatMessage("Hi", makeState(), []);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("includes petState in request body", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "Hi" }),
    } as Response);

    const state = makeState({ hunger: 45 });
    await sendChatMessage("test", state, []);

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1]!.body as string);
    expect(body.petState.hunger).toBe(45);
  });

  it("includes chat history in request body", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "Hi" }),
    } as Response);

    const history: ChatMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi!" },
    ];
    await sendChatMessage("test", makeState(), history);

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1]!.body as string);
    expect(body.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("throws AIError on non-ok response", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    } as Response);

    await expect(sendChatMessage("Hi", makeState(), [])).rejects.toThrow();
  });

  it("throws AIError with reason 'rate_limit' on 429", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "Rate limited" }),
    } as Response);

    try {
      await sendChatMessage("Hi", makeState(), []);
    } catch (err: unknown) {
      expect((err as { reason?: string }).reason).toBe("rate_limit");
    }
  });

  it("throws AIError with reason 'api_error' on 500", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    try {
      await sendChatMessage("Hi", makeState(), []);
    } catch (err: unknown) {
      expect((err as { reason?: string }).reason).toBe("api_error");
    }
  });
});
