import { NextRequest, NextResponse } from "next/server";
import { dataStore, Document, Chunk } from "@/lib/data-store";
import { extractBearerToken, verifyToken } from "@/lib/auth";
import { extractTextFromPdf, splitIntoChunks } from "@/lib/pdf-parser";
import { performImageOCR } from "@/lib/gemini";

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

  const user = dataStore.getUserById(payload.sub);
  if (!user) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  const docs = dataStore.getAuthorizedDocuments(user);
  return NextResponse.json({ documents: docs });
}

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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ detail: "No file uploaded" }, { status: 400 });
    }

    const classification = ((formData.get("classification") as string) || "CONFIDENTIAL").toUpperCase() as
      | "PUBLIC"
      | "CONFIDENTIAL"
      | "RESTRICTED";
    const department = (formData.get("department_id") as string) || user.department_id || "GENERAL";
    const customRolesStr = formData.get("allowed_roles") as string | null;

    let allowedRoles: string[] = [];
    if (customRolesStr) {
      allowedRoles = customRolesStr.split(",").map((r) => r.trim().toUpperCase());
    } else if (classification === "PUBLIC") {
      allowedRoles = ["EMPLOYEE", "MANAGER", "HR", "ADMIN", "FINANCE", "GUEST"];
    } else if (classification === "CONFIDENTIAL") {
      allowedRoles = Array.from(new Set([user.role_id, "ADMIN"]));
    } else {
      // RESTRICTED
      allowedRoles = [user.role_id];
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name || "uploaded_document.pdf";
    const isPdf = filename.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(filename);

    let extractedText = "";
    let ocrNotice: string | null = null;
    let docType = "pdf";

    if (isPdf) {
      docType = "pdf";
      const parsed = await extractTextFromPdf(buffer);
      extractedText = parsed.text;
    } else if (isImage) {
      docType = "image";
      const ocrResult = await performImageOCR(buffer, file.type);
      if (ocrResult.error) {
        ocrNotice = ocrResult.error;
        extractedText = `Image: ${filename} (Metadata registered. Note: ${ocrResult.error})`;
      } else {
        extractedText = ocrResult.text;
      }
    } else {
      docType = "text";
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = `Document: ${filename}. File uploaded successfully but no text could be extracted.`;
    }

    // Split extracted content into permission-aware chunks
    const rawChunks = splitIntoChunks(extractedText, 450, 80);
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const docId = `DOC-${randomSuffix}`;
    const sourceId = `SRC-${randomSuffix}`;

    const newDoc: Document = {
      id: docId,
      source_id: sourceId,
      filename,
      document_type: docType,
      department_id: department,
      classification,
      owner_id: user.id,
      file_path: `/uploads/${filename}`,
      created_at: new Date().toISOString(),
    };

    const newChunks: Chunk[] = rawChunks.map((chunkText, idx) => ({
      id: `chk-${randomSuffix.toLowerCase()}-${idx + 1}`,
      document_id: docId,
      chunk_id: `CHUNK-${randomSuffix}-${idx + 1}`,
      text: chunkText,
      page_number: Math.floor(idx / 3) + 1,
      metadata: {
        allowed_roles: allowedRoles,
        allowed_users: [user.id],
        department,
        classification,
      },
    }));

    // Register with in-memory dataStore
    dataStore.addDocumentWithChunks(newDoc, newChunks);

    return NextResponse.json({
      success: true,
      document: newDoc,
      chunk_count: newChunks.length,
      extracted_sample: newChunks[0]?.text?.slice(0, 180) || "",
      ocr_notice: ocrNotice,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload processing failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

