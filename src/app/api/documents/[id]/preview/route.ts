import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { extractBearerToken, verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ detail: "Invalid or expired session token" }, { status: 401 });
    }

    const user = dataStore.getUserById(payload.sub);
    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ detail: "Missing document id parameter" }, { status: 400 });
    }

    const accessCheck = dataStore.canUserAccessDocument(user, id);

    if (!accessCheck.allowed) {
      // Log unauthorized access attempt in audit trail
      dataStore.logAudit({
        user_id: user.id,
        query: `Direct Object Preview Attempt: ${id}`,
        retrieved_count: 1,
        authorized_count: 0,
        denied_count: 1,
        llm_exposure_count: 0,
        citations: [],
        security_decision: "BLOCKED",
        grounding_score: 0,
      });

      return NextResponse.json(
        {
          detail: accessCheck.reason || "Access Denied: You lack cryptographic clearance to preview this document.",
          error_code: "OBJECT_AUTHORIZATION_DENIED",
        },
        { status: 403 }
      );
    }

    const chunks = dataStore.getDocumentChunks(id);

    // Log authorized preview in audit trail
    dataStore.logAudit({
      user_id: user.id,
      query: `Authorized Document Preview: ${accessCheck.document?.filename}`,
      retrieved_count: chunks.length,
      authorized_count: chunks.length,
      denied_count: 0,
      llm_exposure_count: 0,
      citations: [accessCheck.document?.source_id || ""],
      security_decision: "SECURE",
      grounding_score: 100,
    });

    return NextResponse.json({
      document: accessCheck.document,
      chunks,
      authorized_role: user.role_id,
      classification: accessCheck.document?.classification,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.stack || err.message : String(err);
    console.error("Document preview error:", errorMsg);
    return NextResponse.json({ detail: "Internal server error", error: errorMsg }, { status: 500 });
  }
}
