/**
 * In-memory rate limiter shared across API routes.
 * Keyed by sessionId. Allows 1 request per WINDOW_MS.
 */

const WINDOW_MS = 5_000;

const lastRequestTime = new Map<string, number>();

export function isAllowed(sessionId: string): boolean {
  const last = lastRequestTime.get(sessionId);
  if (last === undefined) return true;
  return Date.now() - last >= WINDOW_MS;
}

export function recordRequest(sessionId: string): void {
  lastRequestTime.set(sessionId, Date.now());
}

export function checkAndRecord(sessionId: string): boolean {
  if (!isAllowed(sessionId)) return false;
  recordRequest(sessionId);
  return true;
}
