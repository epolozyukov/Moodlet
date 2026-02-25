import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isAllowed, recordRequest, checkAndRecord } from "@/lib/rateLimiter";

// Each test uses a unique session ID to avoid cross-test Map contamination.

describe("rateLimiter — 5-second cooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a new (unknown) session", () => {
    expect(isAllowed("rl-new-session-1")).toBe(true);
  });

  it("denies a second request within 5 seconds", () => {
    recordRequest("rl-cooldown-session");
    expect(isAllowed("rl-cooldown-session")).toBe(false);
  });

  it("allows a second request after 5 seconds", () => {
    recordRequest("rl-window-session");
    vi.advanceTimersByTime(5_001);
    expect(isAllowed("rl-window-session")).toBe(true);
  });

  it("checkAndRecord returns true and records on first use", () => {
    expect(checkAndRecord("rl-car-session-1")).toBe(true);
    // Immediately after, should be blocked
    expect(isAllowed("rl-car-session-1")).toBe(false);
  });

  it("checkAndRecord returns false when blocked", () => {
    recordRequest("rl-car-blocked-session");
    expect(checkAndRecord("rl-car-blocked-session")).toBe(false);
  });
});

describe("rateLimiter — hourly cap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to 60 requests per hour", () => {
    const sessionId = "rl-hourly-allow-session";
    const base = Date.now();

    for (let i = 0; i < 60; i++) {
      vi.setSystemTime(base + i * 6_000);
      expect(checkAndRecord(sessionId)).toBe(true);
    }
  });

  it("denies the 61st request within the same hour", () => {
    const sessionId = "rl-hourly-cap-session";
    const base = Date.now();

    for (let i = 0; i < 60; i++) {
      vi.setSystemTime(base + i * 6_000);
      recordRequest(sessionId);
    }

    // 61st check — cooldown passes (6s gap) but hourly cap is reached
    vi.setSystemTime(base + 60 * 6_000);
    expect(isAllowed(sessionId)).toBe(false);
  });

  it("allows requests again after old entries expire past the hour", () => {
    const sessionId = "rl-ttl-session";
    const base = Date.now();

    // Fill up to 60 requests
    for (let i = 0; i < 60; i++) {
      vi.setSystemTime(base + i * 6_000);
      recordRequest(sessionId);
    }

    // Advance past 1 hour so all entries expire
    vi.setSystemTime(base + 3_601_000);
    // Trigger pruning via a new recordRequest
    recordRequest(sessionId);

    // Now there's only 1 entry — 6s later the cooldown passes and count < 60
    vi.setSystemTime(base + 3_601_000 + 6_000);
    expect(isAllowed(sessionId)).toBe(true);
  });
});
