import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "@/app/api/session/route";

function makeRequest(method: "GET" | "POST", body?: object): Request {
  return new Request("http://localhost:3000/api/session", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/session", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 400 when sessionId is missing", async () => {
    const req = makeRequest("POST", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns allowed: true for a new session", async () => {
    const req = makeRequest("POST", { sessionId: "new-session-123" });
    const res = await POST(req);
    const data = await res.json();
    expect(data.allowed).toBe(true);
  });

  it("returns allowed: false within rate limit window", async () => {
    const sessionId = "rapid-post-session";
    await POST(makeRequest("POST", { sessionId }));
    const res = await POST(makeRequest("POST", { sessionId }));
    const data = await res.json();
    expect(data.allowed).toBe(false);
  });

  it("returns allowed: true after rate limit window expires", async () => {
    const sessionId = "expiry-test-session";
    await POST(makeRequest("POST", { sessionId }));
    vi.advanceTimersByTime(6000);
    const res = await POST(makeRequest("POST", { sessionId }));
    const data = await res.json();
    expect(data.allowed).toBe(true);
  });
});

describe("GET /api/session", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 400 when sessionId query param is missing", async () => {
    const req = new Request("http://localhost:3000/api/session", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns allowed: true for an unknown session", async () => {
    const req = new Request("http://localhost:3000/api/session?sessionId=unknown-abc", {
      method: "GET",
    });
    const res = await GET(req);
    const data = await res.json();
    expect(data.allowed).toBe(true);
  });

  it("returns allowed: false for a recently used session", async () => {
    const sessionId = "recent-session";
    await POST(makeRequest("POST", { sessionId }));
    const req = new Request(
      `http://localhost:3000/api/session?sessionId=${sessionId}`,
      { method: "GET" }
    );
    const res = await GET(req);
    const data = await res.json();
    expect(data.allowed).toBe(false);
  });
});
