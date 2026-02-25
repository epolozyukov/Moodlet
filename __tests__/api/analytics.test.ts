import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/analytics/route";

function makeRequest(body: object): Request {
  return new Request("http://localhost:3000/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analytics", () => {
  it("returns 400 when event is missing", async () => {
    const req = makeRequest({ properties: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when event is empty string", async () => {
    const req = makeRequest({ event: "", properties: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 for a valid event", async () => {
    const req = makeRequest({ event: "action_taken", properties: { action: "feed" } });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 for event without properties", async () => {
    const req = makeRequest({ event: "page_view" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns ok: true in response body", async () => {
    const req = makeRequest({ event: "chat_sent", properties: { streak: 3 } });
    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("accepts numeric, string, and boolean property values", async () => {
    const req = makeRequest({
      event: "stat_check",
      properties: { hunger: 42, isSick: false, mood: "happy" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
