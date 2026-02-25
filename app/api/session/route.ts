import { NextResponse } from "next/server";
import { isAllowed, checkAndRecord } from "@/lib/rateLimiter";

export async function POST(request: Request): Promise<NextResponse> {
  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const allowed = checkAndRecord(sessionId);
  return NextResponse.json({ allowed });
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param is required" }, { status: 400 });
  }

  return NextResponse.json({ allowed: isAllowed(sessionId) });
}
