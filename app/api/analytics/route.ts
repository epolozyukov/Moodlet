import { NextResponse } from "next/server";
import type { AnalyticsEvent } from "@/lib/types";

export async function POST(request: Request): Promise<NextResponse> {
  let body: Partial<AnalyticsEvent>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.event || typeof body.event !== "string" || body.event.trim() === "") {
    return NextResponse.json({ error: "event is required" }, { status: 400 });
  }

  // Log for server-side observability; extend to PostHog etc. post-MVP
  console.log("[analytics]", body.event, body.properties ?? {});

  return NextResponse.json({ ok: true });
}
