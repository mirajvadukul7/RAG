import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let username = "";
    let password = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      username = (formData.get("username") as string) || "";
      password = (formData.get("password") as string) || "";
    } else {
      const body = await req.json();
      username = body.username || "";
      password = body.password || "";
    }

    const user = dataStore.getUserByUsername(username);
    if (!user || user.password !== password) {
      return NextResponse.json({ detail: "Incorrect username or password" }, { status: 401 });
    }

    const token = createToken({ sub: user.id, role: user.role_id, username: user.username });
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
