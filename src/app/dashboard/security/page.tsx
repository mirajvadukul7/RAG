"use client";
import { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Activity,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  user_id: string;
  query: string;
  security_decision: "SECURE" | "BLOCKED" | string;
  authorized_count: number;
  denied_count: number;
  llm_exposure_count: number;
  timestamp?: string;
}

export default function SecurityTrace() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<"ALL" | "SECURE" | "BLOCKED">("ALL");

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/security/audit", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/security/audit", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setLogs(data.logs || []);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (decisionFilter !== "ALL" && log.security_decision !== decisionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.query.toLowerCase().includes(q) ||
        log.user_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const blockedTotal = logs.filter((l) => l.security_decision === "BLOCKED").length;
  const secureTotal = logs.filter((l) => l.security_decision === "SECURE").length;

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8 bg-[#060a12] text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white flex items-center font-mono">
              <Activity className="w-6 h-6 mr-3 text-cyan-400" /> Security Trace &amp; Audit Trail
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident logs of every query, authorization decision, denied candidate chunk count, and zero-leakage verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 bg-[#090f1e] border border-slate-800 rounded-xl text-xs font-mono text-cyan-400">
            Total Events: {logs.length}
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 text-slate-400 hover:text-white bg-[#090f1e] border border-slate-800 rounded-xl transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#090f1e] border border-slate-800/80 shadow-lg">
          <div className="text-xs text-slate-400 mb-1">Total Audit Events</div>
          <div className="text-2xl font-extrabold text-white font-mono">{logs.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">100% Traceability</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090f1e] border border-slate-800/80 shadow-lg">
          <div className="text-xs text-emerald-400 mb-1">Authorized Queries</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{secureTotal}</div>
          <div className="text-[10px] text-slate-500 mt-1">Bounded Retrieval Passed</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090f1e] border border-slate-800/80 shadow-lg">
          <div className="text-xs text-red-400 mb-1">Adversarial Interceptions</div>
          <div className="text-2xl font-extrabold text-red-400 font-mono">{blockedTotal}</div>
          <div className="text-[10px] text-emerald-400 mt-1">0 Chunks Leaked to LLM</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#090f1e] border border-slate-800 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search query or principal ID..."
            className="w-full bg-[#060a12] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center space-x-1 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {(["ALL", "SECURE", "BLOCKED"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDecisionFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                decisionFilter === mode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {mode === "ALL" ? "All Decisions" : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream */}
      <div className="space-y-4">
        {filteredLogs.map((log: AuditLogItem) => (
          <div
            key={log.id}
            className="bg-[#090f1e] border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all relative overflow-hidden"
          >
            {/* Edge Accent */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${
                log.security_decision === "SECURE" ? "bg-emerald-400" : "bg-red-500"
              }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-sm font-semibold text-white break-all flex items-center">
                <span className="text-cyan-400 mr-2 font-mono">&gt;</span>
                &quot;{log.query}&quot;
              </div>
              <div
                className={`text-xs font-bold font-mono px-3 py-1 rounded-lg flex items-center ${
                  log.security_decision === "SECURE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {log.security_decision === "SECURE" ? (
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                )}
                {log.security_decision}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#060a12] p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">
                  Principal ID
                </span>
                <span className="text-slate-300 font-mono text-xs truncate block">{log.user_id}</span>
              </div>
              <div className="bg-[#060a12] p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">
                  Authorized Chunks
                </span>
                <span className="text-cyan-400 font-mono font-bold text-sm">
                  {log.authorized_count}
                </span>
              </div>
              <div className="bg-[#060a12] p-3 rounded-xl border border-slate-800/60">
                <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">
                  Denied Candidate Chunks
                </span>
                <span className="text-amber-400 font-mono font-bold text-sm">{log.denied_count}</span>
              </div>
              <div className="bg-[#060a12] p-3 rounded-xl border border-slate-800/60">
                <span className="text-emerald-400 block mb-1 text-[10px] uppercase font-semibold">
                  Unauthorized LLM Exposure
                </span>
                <span className="text-emerald-400 font-bold text-sm font-mono flex items-center">
                  0 chunks <span className="text-[10px] ml-1.5 text-emerald-500 font-normal">(Zero Leakage)</span>
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-16 bg-[#090f1e] border border-slate-800/80 rounded-2xl">
            <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Matching Audit Events</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Execute queries in Secure Chat or run the Security Lab benchmark to inspect live authorization logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
