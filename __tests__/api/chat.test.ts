import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, sanitizePetState } from "@/app/api/chat/route";
import type { PetState } from "@/lib/types";

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

function makeRequest(body: object): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Stub API key so the route doesn't short-circuit to fallback
    vi.stubEnv("GROQ_API_KEY", "test-key-123");
    // Clear in-memory rate limit store between tests by advancing time
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns 400 when required fields are missing", async () => {
    const req = makeRequest({ messages: [] }); // missing petState and sessionId
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with AI response on success", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello there!" } }],
      }),
    } as Response);

    const req = makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId: "test-session-abc",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("Hello there!");
  });

  it("returns 429 when same session sends requests too quickly", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hi" } }],
      }),
    } as Response);

    const sessionId = "rapid-session-xyz";
    const body = {
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId,
    };

    // First request should succeed
    const res1 = await POST(makeRequest(body));
    expect(res1.status).toBe(200);

    // Immediate second request — should be rate limited
    const res2 = await POST(makeRequest(body));
    expect(res2.status).toBe(429);
  });

  it("allows a second request after rate limit window passes", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hi" } }],
      }),
    } as Response);

    const sessionId = "session-with-wait";
    const body = {
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId,
    };

    // First request
    await POST(makeRequest(body));
    // Advance time by 6 seconds (past the 5s rate limit)
    vi.advanceTimersByTime(6000);

    const res = await POST(makeRequest(body));
    expect(res.status).toBe(200);
  });

  it("returns in-character 429 body (not raw error)", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Hi" } }] }),
    } as Response);

    const sessionId = "rate-limit-body-check";
    const body = {
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId,
    };

    await POST(makeRequest(body));
    const res = await POST(makeRequest(body));
    const data = await res.json();

    expect(data.content).toBeDefined();
    expect(typeof data.content).toBe("string");
    expect(data.content.length).toBeGreaterThan(0);
  });

  it("falls back to secondary model on primary 503", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "Fallback response" } }] }),
      } as Response);

    const req = makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId: "fallback-session",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("Fallback response");
  });

  it("returns in-character error response when both models fail", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response);

    const req = makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId: "both-fail-session",
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // Never expose errors to client
    const data = await res.json();
    expect(data.content).toBeDefined();
    expect(typeof data.content).toBe("string");
  });

  it("uses temperature 1.1 when energy is low", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "zzz..." } }] }),
    } as Response);

    await POST(makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState({ energy: 20 }),
      sessionId: "temp-low-energy-session",
    }));

    const body = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(body.temperature).toBe(1.1);
  });

  it("uses temperature 0.8 when energy is normal", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Hi!" } }] }),
    } as Response);

    await POST(makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState({ energy: 60 }),
      sessionId: "temp-normal-energy-session",
    }));

    const body = JSON.parse(mockFetch.mock.calls[0][1]!.body as string);
    expect(body.temperature).toBe(0.8);
  });

  it("trims responses longer than 900 characters", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "word ".repeat(220) } }] }),
    } as Response);

    const res = await POST(makeRequest({
      messages: [{ role: "user", content: "Hi" }],
      petState: makeState(),
      sessionId: "trim-test-session",
    }));

    const data = await res.json();
    expect(data.content.length).toBeLessThan(1100); // original is 1100
    expect(data.content.length).toBeLessThanOrEqual(902); // 900 chars + "…"
    expect(data.content.endsWith("…")).toBe(true);
  });
});

describe("sanitizePetState", () => {
  it("clamps stats above 100 down to 100", () => {
    const raw = makeState({ hunger: 9999, hygiene: 200, energy: 150, happiness: 999, health: 500 });
    const safe = sanitizePetState(raw);
    expect(safe.hunger).toBe(100);
    expect(safe.hygiene).toBe(100);
    expect(safe.energy).toBe(100);
    expect(safe.happiness).toBe(100);
    expect(safe.health).toBe(100);
  });

  it("clamps stats below 0 up to 0", () => {
    const raw = makeState({ hunger: -10, energy: -50 });
    const safe = sanitizePetState(raw);
    expect(safe.hunger).toBe(0);
    expect(safe.energy).toBe(0);
  });

  it("preserves health = 0 (pet at death's door)", () => {
    const raw = makeState({ health: 0 });
    const safe = sanitizePetState(raw);
    expect(safe.health).toBe(0);
  });

  it("strips injection characters from pet name", () => {
    const raw = makeState({ name: "IGNORE<script>INSTRUCTIONS</script>" });
    const safe = sanitizePetState(raw);
    expect(safe.name).not.toContain("<");
    expect(safe.name).not.toContain(">");
  });

  it("truncates pet name to 32 characters", () => {
    const raw = makeState({ name: "A".repeat(64) });
    const safe = sanitizePetState(raw);
    expect(safe.name.length).toBeLessThanOrEqual(32);
  });

  it("falls back to 'Pet' when name is empty after sanitization", () => {
    const raw = makeState({ name: "!!!###$$$" });
    const safe = sanitizePetState(raw);
    expect(safe.name).toBe("Pet");
  });
});
