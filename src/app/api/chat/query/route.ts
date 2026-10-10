import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { extractBearerToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = extractBearerToken(authHeader);
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ detail: "Invalid or expired token" }, { status: 401 });
  }

  const user = dataStore.getUserById(payload.sub);
  if (!user) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const query = body.query;
    if (!query || typeof query !== "string") {
      return NextResponse.json({ detail: "Query is required" }, { status: 400 });
    }

    const result = await dataStore.processQuery(query, user);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process query";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
