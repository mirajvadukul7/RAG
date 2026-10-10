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
    return NextResponse.json({ detail: "Invalid or expired session token" }, { status: 401 });
  }

  const user = dataStore.getUserById(payload.sub);
  if (!user) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  // Define the enterprise Role-Permission Matrix
  const rolePermissionMatrix = [
    {
      role: "ADMIN",
      title: "Security Administrator",
      description: "Unrestricted cryptographic clearance across all documents, vector indices, and system controls",
      permissions: [
        { resource: "Public Knowledgebase", access: "FULL", granted: true },
        { resource: "HR Confidential Documents", access: "FULL", granted: true },
        { resource: "Finance Invoices & Ledgers", access: "FULL", granted: true },
        { resource: "Employee Salary Database (RLS)", access: "ALL_RECORDS", granted: true },
        { resource: "Security Lab Adversarial Suite", access: "EXECUTE", granted: true },
        { resource: "System Audit Telemetry", access: "READ_ALL", granted: true },
        { resource: "Policy Administration", access: "WRITE", granted: true },
      ],
    },
    {
      role: "HR",
      title: "Human Resources Lead",
      description: "Access to employee records and HR confidential policies; restricted from finance ledger",
      permissions: [
        { resource: "Public Knowledgebase", access: "FULL", granted: true },
        { resource: "HR Confidential Documents", access: "DEPARTMENT_ONLY", granted: true },
        { resource: "Finance Invoices & Ledgers", access: "DENIED", granted: false },
        { resource: "Employee Salary Database (RLS)", access: "HR_DEPARTMENT", granted: true },
        { resource: "Security Lab Adversarial Suite", access: "DENIED", granted: false },
        { resource: "System Audit Telemetry", access: "OWN_EVENTS", granted: true },
        { resource: "Policy Administration", access: "DENIED", granted: false },
      ],
    },
    {
      role: "FINANCE",
      title: "Financial Auditor",
      description: "Authorized for accounting ledgers and financial scans; isolated from HR executive records",
      permissions: [
        { resource: "Public Knowledgebase", access: "FULL", granted: true },
        { resource: "HR Confidential Documents", access: "DENIED", granted: false },
        { resource: "Finance Invoices & Ledgers", access: "DEPARTMENT_ONLY", granted: true },
        { resource: "Employee Salary Database (RLS)", access: "OWN_RECORD_ONLY", granted: false },
        { resource: "Security Lab Adversarial Suite", access: "DENIED", granted: false },
        { resource: "System Audit Telemetry", access: "OWN_EVENTS", granted: true },
        { resource: "Policy Administration", access: "DENIED", granted: false },
      ],
    },
    {
      role: "EMPLOYEE",
      title: "Engineering Staff",
      description: "Standard employee access; public manuals only, strict self-only salary isolation",
      permissions: [
        { resource: "Public Knowledgebase", access: "FULL", granted: true },
        { resource: "HR Confidential Documents", access: "DENIED", granted: false },
        { resource: "Finance Invoices & Ledgers", access: "DENIED", granted: false },
        { resource: "Employee Salary Database (RLS)", access: "SELF_ONLY", granted: false },
        { resource: "Security Lab Adversarial Suite", access: "DENIED", granted: false },
        { resource: "System Audit Telemetry", access: "OWN_EVENTS", granted: true },
        { resource: "Policy Administration", access: "DENIED", granted: false },
      ],
    },
  ];

  // Document level policies
  const documentPolicies = dataStore.documents.map((doc) => {
    const isAccessible =
      user.role_id === "ADMIN" ||
      doc.classification === "PUBLIC" ||
      doc.owner_id === user.id ||
      doc.department_id === user.department_id;

    return {
      id: doc.id,
      source_id: doc.source_id,
      filename: doc.filename,
      classification: doc.classification,
      department: doc.department_id || "ALL",
      owner_id: doc.owner_id,
      user_has_clearance: isAccessible,
    };
  });

  return NextResponse.json({
    current_user: {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      department_id: user.department_id,
    },
    matrix: rolePermissionMatrix,
    document_policies: documentPolicies,
  });
}

export async function POST(req: NextRequest) {
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

  // Crucial Security Rule: Only ADMIN can modify policies
  if (user.role_id !== "ADMIN") {
    dataStore.logAudit({
      user_id: user.id,
      query: "Unauthorized Policy Edit Attempt",
      retrieved_count: 0,
      authorized_count: 0,
      denied_count: 1,
      llm_exposure_count: 0,
      citations: [],
      security_decision: "BLOCKED",
      grounding_score: 0,
    });

    return NextResponse.json(
      { detail: "Forbidden: Only authenticated administrators can modify security policies." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { document_id, new_classification } = body;

    const doc = dataStore.documents.find((d) => d.id === document_id || d.source_id === document_id);
    if (!doc) {
      return NextResponse.json({ detail: "Document not found" }, { status: 404 });
    }

    if (!["PUBLIC", "CONFIDENTIAL", "RESTRICTED"].includes(new_classification)) {
      return NextResponse.json({ detail: "Invalid classification value" }, { status: 400 });
    }

    doc.classification = new_classification;

    // Update chunks classification tag as well
    for (const chunk of dataStore.chunks) {
      if (chunk.document_id === doc.id) {
        chunk.metadata.classification = new_classification;
      }
    }

    dataStore.logAudit({
      user_id: user.id,
      query: `Security Policy Updated: ${doc.filename} -> ${new_classification}`,
      retrieved_count: 1,
      authorized_count: 1,
      denied_count: 0,
      llm_exposure_count: 0,
      citations: [doc.source_id],
      security_decision: "SECURE",
      grounding_score: 100,
    });

    return NextResponse.json({
      success: true,
      message: `Updated security classification for ${doc.filename} to ${new_classification}`,
      document: doc,
    });
  } catch {
    return NextResponse.json({ detail: "Invalid request payload" }, { status: 400 });
  }
}
