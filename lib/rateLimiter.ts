/**
 * In-memory rate limiter shared across API routes.
 * Keyed by sessionId.
 * Enforces: 1 request per WINDOW_MS (5s cooldown) AND max HOURLY_LIMIT per hour.
 * Old timestamps are pruned on each write to prevent unbounded Map growth.
 */

const WINDOW_MS    = 5_000;
const HOUR_MS      = 3_600_000;
const HOURLY_LIMIT = 60;

const requestLog = new Map<string, number[]>();

function getRecentLog(sessionId: string, now: number): number[] {
  return (requestLog.get(sessionId) ?? []).filter((t) => now - t < HOUR_MS);
}

export function isAllowed(sessionId: string): boolean {
  const now = Date.now();
  const recent = getRecentLog(sessionId, now);
  if (recent.length > 0 && now - recent[recent.length - 1] < WINDOW_MS) return false;
  if (recent.length >= HOURLY_LIMIT) return false;
  return true;
}

export function recordRequest(sessionId: string): void {
  const now = Date.now();
  const recent = getRecentLog(sessionId, now);
  recent.push(now);
  requestLog.set(sessionId, recent);
}

export function checkAndRecord(sessionId: string): boolean {
  if (!isAllowed(sessionId)) return false;
  recordRequest(sessionId);
  return true;
}
