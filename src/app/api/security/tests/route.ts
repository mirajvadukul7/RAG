import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { extractBearerToken, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = extractBearerToken(authHeader);
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ detail: "Invalid or expired token" }, { status: 401 });
  }

  const tests = dataStore.getSecurityTests();
  return NextResponse.json({ tests });
}
