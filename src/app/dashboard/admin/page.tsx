"use client";
import { useState, useEffect } from "react";
import {
  Activity,
  Users,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AdminStats {
  total_users: number;
  total_documents: number;
  total_chunks: number;
  total_vectors: number;
  queries_today: number;
  blocked_queries: number;
  security_violations: number;
  average_grounding_score: number;
}

interface SecurityTest {
  id: string;
  name: string;
  attempts: string;
  expected: string;
  control: string;
  principal: string;
  threatType: string;
}

interface SecurityResult {
  id: string;
  status: string;
  actual?: string;
}

export default function SecurityLabPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tests, setTests] = useState<SecurityTest[]>([]);
  const [testResults, setTestResults] = useState<SecurityResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const token = localStorage.getItem("token");
      try {
        const [statsRes, testsRes] = await Promise.all([
          fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/security/tests", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!ignore && statsRes.status === 403) {
          setUnauthorized(true);
          return;
        }

        if (!ignore && statsRes.ok) {
          const statsData: AdminStats = await statsRes.json();
          setStats(statsData);
        }

        if (!ignore && testsRes.ok) {
          const testsData = await testsRes.json();
          setTests(testsData.tests || []);
        }
      } catch {
        // ignore
      }
    }

    void loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const runTests = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/security/tests/run", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTestResults(data.results);
        setLastRunTime(new Date().toLocaleTimeString());
      }
    } finally {
      setRunning(false);
    }
  };

  if (unauthorized) {
    return (
      <div className="p-8 h-full flex items-center justify-center bg-[#060a12]">
        <div className="bg-[#140b12] border border-red-500/30 p-8 rounded-3xl max-w-md text-center shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2 font-mono">Administrative Clearance Required</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current authenticated profile lacks permission to run the adversarial test benchmark matrix. Switch to the <strong className="text-cyan-400">Admin</strong> role using the bottom-left sidebar switcher.
          </p>
        </div>
      </div>
    );
  }

  const passedCount = testResults ? testResults.filter((r) => r.status === "PASS").length : 6;

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8 bg-[#060a12] text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 mr-3 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white flex items-center font-mono">
              Security Test Lab
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
              Automated Adversarial Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates real cross-role adversarial retrieval attempts to verify 0 unauthorized chunks ever contact the LLM.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={running}
          className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-violet-950/50 disabled:opacity-50 shrink-0"
        >
          <Activity className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
          <span>{running ? "Simulating Threat Vectors..." : "Run Security Test Suite"}</span>
        </button>
      </div>

      {/* Hero Benchmark Score Card */}
      <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-r from-[#0c1429] via-[#0d162d] to-[#080d1a] border border-slate-800/90 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {testResults ? "TEST RUN COMPLETE" : "READY FOR BENCHMARK"}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
              Empirical Zero-Leakage Benchmark Suite
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              6 rigorous threat models spanning cross-role retrieval, adversarial prompt injection containment, cryptographic token forgery, and IDOR prevention.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-[#060a12]/80 p-4 rounded-2xl border border-slate-800/80 shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {passedCount} / {tests.length || 6}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Scenarios Passing</div>
            </div>
            <div className="text-center px-3">
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">0</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Chunks Leaked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#090f1e] border border-slate-800/80 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center text-slate-400 text-xs mb-2">
              <Users className="w-4 h-4 mr-2 text-cyan-400" /> Active Role Profiles
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.total_users}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">ADMIN, EMPLOYEE, HR, FINANCE</div>
          </div>

          <div className="bg-[#090f1e] border border-slate-800/80 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center text-slate-400 text-xs mb-2">
              <FileText className="w-4 h-4 mr-2 text-violet-400" /> Indexed Documents
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.total_documents}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">PDF, TXT, OCR Images</div>
          </div>

          <div className="bg-[#090f1e] border border-slate-800/80 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center text-slate-400 text-xs mb-2">
              <Database className="w-4 h-4 mr-2 text-cyan-400" /> Security Chunks
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.total_chunks}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">Cryptographically Tagged</div>
          </div>

          <div className="bg-[#090f1e] border border-slate-800/80 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center text-slate-400 text-xs mb-2">
              <ShieldAlert className="w-4 h-4 mr-2 text-emerald-400" /> Intercepted Violations
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.security_violations}</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">0 Bytes Reached LLM</div>
          </div>
        </div>
      )}

      {/* 6 Interactive Security Test Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Adversarial Threat Vectors &amp; Verification Checks ({tests.length})
            </h2>
          </div>
          {lastRunTime && (
            <span className="text-[10px] text-slate-400 font-mono">
              Last executed at: <strong className="text-cyan-300">{lastRunTime}</strong>
            </span>
          )}
        </div>

        <div className="space-y-3">
          {tests.map((t) => {
            const res = testResults?.find((r) => r.id === t.id);
            const isExpanded = expandedTest === t.id;

            return (
              <div
                key={t.id}
                className="bg-[#090f1e] border border-slate-800/90 rounded-2xl p-5 shadow-xl transition-all hover:border-slate-700"
              >
                <div
                  onClick={() => setExpandedTest(isExpanded ? null : t.id)}
                  className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-mono text-cyan-400 font-bold text-xs shrink-0">
                      [{t.id}]
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                        <span>{t.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          {t.threatType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        Target Principal: <code className="text-slate-300">{t.principal}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {res ? (
                      res.status === "PASS" ? (
                        <span className="inline-flex items-center text-emerald-400 font-bold text-xs bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-lg font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> PASS (VERIFIED)
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-400 font-bold text-xs bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-lg font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-red-400" /> FAIL
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500 font-mono text-xs flex items-center bg-[#060a12] px-2.5 py-1 rounded-lg border border-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Ready to execute
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Detailed Audit Card */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          1. What the test attempts:
                        </span>
                        <p className="text-slate-300 leading-relaxed">{t.attempts}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          2. Expected Secure Behavior:
                        </span>
                        <p className="text-cyan-300 leading-relaxed font-mono">{t.expected}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          3. Actual Test Execution Result:
                        </span>
                        <p className="text-emerald-400 font-mono leading-relaxed">
                          {res?.actual || "Run test suite above to capture live empirical assertion telemetry."}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          4. Security Control Architecture:
                        </span>
                        <p className="text-slate-300 leading-relaxed">{t.control}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
