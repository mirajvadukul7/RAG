"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  Lock,
  FileText,
  AlertTriangle,
  RefreshCw,
  Sliders,
} from "lucide-react";

interface PermissionItem {
  resource: string;
  access: string;
  granted: boolean;
}

interface RoleMatrixItem {
  role: string;
  title: string;
  description: string;
  permissions: PermissionItem[];
}

interface DocumentPolicy {
  id: string;
  source_id: string;
  filename: string;
  classification: "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED";
  department: string;
  owner_id: string;
  user_has_clearance: boolean;
}

interface CurrentUser {
  id: string;
  username: string;
  role_id: string;
  department_id: string | null;
}

export default function AccessControlPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [matrix, setMatrix] = useState<RoleMatrixItem[]>([]);
  const [documents, setDocuments] = useState<DocumentPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Policy Simulator State
  const [simRole, setSimRole] = useState<string>("EMPLOYEE");
  const [simDocId, setSimDocId] = useState<string>("");

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/access/policies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.current_user);
        setMatrix(data.matrix || []);
        setDocuments(data.document_policies || []);
        if (data.document_policies?.length > 0 && !simDocId) {
          setSimDocId(data.document_policies[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [simDocId]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleUpdatePolicy = async (docId: string, newClassification: string) => {
    setUpdatingDocId(docId);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/access/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ document_id: docId, new_classification: newClassification }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ text: data.message, isError: false });
        await loadPolicies();
      } else {
        setStatusMessage({ text: data.detail || "Failed to update policy", isError: true });
      }
    } catch {
      setStatusMessage({ text: "Network failure while updating policy", isError: true });
    } finally {
      setUpdatingDocId(null);
    }
  };

  // Simulator Logic
  const getSimulatedResult = () => {
    const doc = documents.find((d) => d.id === simDocId);
    if (!doc) return null;

    if (simRole === "ADMIN") {
      return {
        allowed: true,
        reason: "Administrative principal holds universal clearance across all classification domains.",
      };
    }
    if (doc.classification === "PUBLIC") {
      return {
        allowed: true,
        reason: "Document is classified as PUBLIC; all authenticated roles are granted retrieval access.",
      };
    }
    if (doc.classification === "CONFIDENTIAL") {
      if (simRole === "HR" && doc.department === "HR") {
        return {
          allowed: true,
          reason: "Role clearance HR matches Document Department HR; access granted.",
        };
      }
      if (simRole === "FINANCE" && doc.department === "FINANCE") {
        return {
          allowed: true,
          reason: "Role clearance FINANCE matches Document Department FINANCE; access granted.",
        };
      }
      return {
        allowed: false,
        reason: `Access Denied: Role '${simRole}' does not match Department '${doc.department}'. Pre-LLM gate intercepts retrieval.`,
      };
    }
    // RESTRICTED
    return {
      allowed: false,
      reason: "Document is RESTRICTED to primary owner; standard role access is rejected.",
    };
  };

  const simResult = getSimulatedResult();

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8 bg-[#060a12] text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white flex items-center font-mono">
              <KeyRound className="w-6 h-6 mr-3 text-cyan-400" /> Access Control Center
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
              RBAC + ABAC + RLS Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic permission evaluation that filters unauthorized document chunks before LLM prompt assembly.
          </p>
        </div>

        <button
          onClick={loadPolicies}
          className="flex items-center space-x-2 px-4 py-2 bg-[#090f1e] hover:bg-[#0d162d] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Sync Policies</span>
        </button>
      </div>

      {/* Active Principal Security Clearance Card */}
      {currentUser && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c1429] via-[#0d162d] to-[#080d1a] border border-slate-800/90 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Lock className="w-3 h-3 mr-1 text-cyan-400" />
                AUTHENTICATED PRINCIPAL CLEARANCE
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight font-mono flex items-center space-x-2">
                <span>{currentUser.username}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                  {currentUser.role_id}
                </span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Identity and role are derived strictly from server-side HMAC-SHA256 session token verification. Client-side tampering cannot elevate clearances.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs shrink-0">
              <div className="p-3 rounded-xl bg-[#060a12]/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Department</span>
                <span className="text-cyan-300 font-mono font-bold">{currentUser.department_id || "Enterprise Global"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#060a12]/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Policy Authority</span>
                <span className={currentUser.role_id === "ADMIN" ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  {currentUser.role_id === "ADMIN" ? "Policy Admin" : "Enforced Consumer"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
            statusMessage.isError
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {statusMessage.isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Interactive Policy Simulator */}
      <div className="p-6 rounded-3xl bg-[#090f1e] border border-slate-800/90 shadow-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-tight font-mono">
            Interactive Zero-Leakage Access Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Simulate how the pre-LLM gate handles any candidate principal against any indexed document before supplying context to the model.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Select Principal Role
            </label>
            <select
              value={simRole}
              onChange={(e) => setSimRole(e.target.value)}
              className="w-full bg-[#060a12] border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500/60"
            >
              <option value="EMPLOYEE">EMPLOYEE — Engineering Staff</option>
              <option value="HR">HR — Human Resources Lead</option>
              <option value="FINANCE">FINANCE — Financial Auditor</option>
              <option value="ADMIN">ADMIN — System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Target Resource Document
            </label>
            <select
              value={simDocId}
              onChange={(e) => setSimDocId(e.target.value)}
              className="w-full bg-[#060a12] border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-500/60"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.classification} • {d.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {simResult && (
          <div
            className={`p-4 rounded-xl border text-xs mt-3 flex items-start space-x-3 ${
              simResult.allowed
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {simResult.allowed ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold flex items-center space-x-2">
                <span>{simResult.allowed ? "ACCESS AUTHORIZED (RETRIEVAL PERMITTED)" : "ACCESS BLOCKED (0 CHUNKS TO LLM)"}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">{simResult.reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Role-Permission Matrix Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-mono">
              Enterprise Role-Permission Matrix
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Server-enforced policies</span>
          </div>

          <div className="flex items-center space-x-1 p-1 bg-[#090f1e] rounded-xl border border-slate-800 text-xs">
            {["ALL", "ADMIN", "HR", "FINANCE", "EMPLOYEE"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1 rounded-lg font-medium text-[10px] transition-colors ${
                  selectedRole === r
                    ? "bg-gradient-to-r from-violet-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matrix
            .filter((m) => selectedRole === "ALL" || m.role === selectedRole)
            .map((item) => (
              <div
                key={item.role}
                className="bg-[#090f1e] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                      <span>{item.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                        {item.role}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {item.permissions.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#060a12] border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-medium">{p.resource}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold flex items-center ${
                          p.granted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {p.granted ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1 text-red-400" />
                        )}
                        {p.access}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Document-Level Access Policies */}
      <div className="bg-[#090f1e] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 md:p-5 bg-[#070c18] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Document-Level Classification Policies ({documents.length})
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {currentUser?.role_id === "ADMIN" ? (
              <span className="text-emerald-400 font-bold">Admin Clearance: Policy Editing Enabled</span>
            ) : (
              <span className="text-amber-400">Read-Only View (Admin required for editing)</span>
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060a12] border-b border-slate-800/80 text-slate-400">
              <tr>
                <th className="px-5 py-3.5 font-medium font-mono">Source ID</th>
                <th className="px-5 py-3.5 font-medium">Document Name</th>
                <th className="px-5 py-3.5 font-medium">Department Boundary</th>
                <th className="px-5 py-3.5 font-medium">Current Classification</th>
                <th className="px-5 py-3.5 font-medium">Your Clearance Status</th>
                {currentUser?.role_id === "ADMIN" && (
                  <th className="px-5 py-3.5 font-medium text-right">Policy Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="px-5 py-4 font-mono text-cyan-400 font-bold">{doc.source_id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-200">{doc.filename}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{doc.department}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                        doc.classification === "PUBLIC"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : doc.classification === "CONFIDENTIAL"
                          ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {doc.classification}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {doc.user_has_clearance ? (
                      <span className="inline-flex items-center text-emerald-400 font-mono text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-400 font-mono text-[11px] font-bold">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Denied (Pre-LLM Purged)
                      </span>
                    )}
                  </td>
                  {currentUser?.role_id === "ADMIN" && (
                    <td className="px-5 py-4 text-right">
                      <select
                        disabled={updatingDocId === doc.id}
                        value={doc.classification}
                        onChange={(e) => handleUpdatePolicy(doc.id, e.target.value)}
                        className="bg-[#060a12] border border-slate-700 hover:border-cyan-500/50 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                        <option value="RESTRICTED">RESTRICTED</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
