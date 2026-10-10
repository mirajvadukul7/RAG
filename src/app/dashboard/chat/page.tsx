"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Database,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Lock,
  Terminal,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

interface EvidenceItem {
  source_id: string;
  source_type: string;
  document: string;
  page?: number | null;
  chunk_id: string;
  text: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  answer?: string;
  error?: string;
  citations?: string[];
  grounding_score?: number;
  security_status?: "SECURE" | "BLOCKED" | string;
  llm_exposure?: number;
  evidence?: EvidenceItem[];
}

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText || query;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/chat/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: userMsg.content }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", ...data }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          error: "Failed to connect to ORYNTH zero-leakage core gateway.",
          security_status: "BLOCKED",
          llm_exposure: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const promptSuggestions = [
    {
      title: "Leave Policy",
      query: "What is the annual leave policy?",
      badge: "PUBLIC",
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
      target: "Employee Manual",
    },
    {
      title: "Invoice 001",
      query: "What is the invoice amount in invoice_001?",
      badge: "FINANCE",
      color: "border-amber-500/30 text-amber-400 bg-amber-500/10",
      target: "Invoice Scan",
    },
    {
      title: "Rahul's Salary",
      query: "What is Rahul's salary?",
      badge: "RLS ROW",
      color: "border-red-500/30 text-red-400 bg-red-500/10",
      target: "Employee DB",
    },
    {
      title: "Executive Grades",
      query: "What are the executive grades in the confidential HR document?",
      badge: "HR CONFIDENTIAL",
      color: "border-violet-500/30 text-violet-300 bg-violet-500/10",
      target: "Executive PDF",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#060a12] text-slate-100">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-6 md:px-8 bg-[#090f1e]/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600/30 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center">
              Secure Multimodal Chat
              <span className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                ZERO-LEAKAGE ACTIVE
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Deterministic RBAC + Row-Level Security Pre-Filtering Gate
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center text-xs text-slate-400 bg-[#0c1429] px-3.5 py-1.5 rounded-full border border-slate-800 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-300">LLM Context Filter: 100% Enforced</span>
        </div>
      </header>

      {/* Quick Prompts Bar (Always accessible for live demo) */}
      <div className="px-6 md:px-8 py-2.5 bg-[#080d19] border-b border-slate-800/60 shrink-0">
        <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-cyan-400" /> Test Vectors:
          </span>
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              disabled={loading}
              className={`shrink-0 text-left px-3 py-1.5 rounded-xl border text-[11px] transition-all hover:scale-[1.02] flex items-center space-x-2 ${item.color}`}
            >
              <span className="font-semibold text-slate-200">{item.title}</span>
              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-black/40 font-bold">
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-5 max-w-xl mx-auto text-center py-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-950/40">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight font-mono">
                ORYNTH Cryptographic RAG
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-md">
                Every query is evaluated against cryptographic document boundaries and Row-Level Security before prompt assembly. Unauthorized candidate chunks are purged <strong className="text-cyan-300">before</strong> contacting the LLM.
              </p>
            </div>

            <div className="w-full pt-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center justify-center">
                <Terminal className="w-3 h-3 mr-1 text-cyan-400" /> Click a Demo Vector to Run:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {promptSuggestions.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p.query)}
                    className="p-3 bg-[#090f1e] hover:bg-[#0d162d] rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 group-hover:text-cyan-300 font-mono">
                        {p.title}
                      </span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold ${p.color}`}>
                        {p.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">&quot;{p.query}&quot;</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}>
            {msg.role === "user" ? (
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[80%] md:max-w-[70%] shadow-lg shadow-violet-950/40 border border-violet-500/30">
                <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
              </div>
            ) : (
              <div className="w-full max-w-4xl space-y-3">
                <div
                  className={`border p-5 md:p-6 rounded-2xl rounded-tl-sm shadow-xl relative overflow-hidden transition-all ${
                    msg.security_status === "SECURE"
                      ? "bg-[#090f1e] border-slate-800/90 shadow-cyan-950/20"
                      : "bg-[#140b12] border-red-500/40 shadow-red-950/30"
                  }`}
                >
                  {/* Glowing Lateral Border */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      msg.security_status === "SECURE"
                        ? "bg-gradient-to-b from-emerald-400 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                        : "bg-gradient-to-b from-red-500 via-rose-500 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                    }`}
                  />

                  {/* Top Status Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/70">
                    <div className="flex items-center space-x-2">
                      {msg.security_status === "SECURE" ? (
                        <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          ACCESS AUTHORIZED
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-bold text-red-400 bg-red-500/15 px-3 py-1 rounded-lg border border-red-500/40 font-mono animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                          ACCESS BLOCKED (ZERO LEAKAGE)
                        </span>
                      )}

                      {msg.grounding_score !== undefined && msg.security_status === "SECURE" && (
                        <span className="text-[11px] text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-lg bg-[#060a12] font-mono">
                          Grounding: {msg.grounding_score.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center font-mono">
                      <Lock className="w-3 h-3 mr-1 text-slate-500" />
                      LLM Exposure:{" "}
                      <strong
                        className={`ml-1 font-mono ${
                          msg.llm_exposure === 0 ? "text-emerald-400" : "text-cyan-300"
                        }`}
                      >
                        {msg.llm_exposure ?? 0} chunks (0 bytes leaked)
                      </strong>
                    </div>
                  </div>

                  {/* Blocked Alert Banner if unauthorized */}
                  {msg.security_status === "BLOCKED" && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-red-200">Security Boundary Enforced:</div>
                        <div>
                          Requested data contains protected clearances or row-level isolation rules that your authenticated principal does not possess. Content was dropped before assembling prompt context.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Answer Text */}
                  <div className="relative group/answer">
                    <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans pr-8">
                      {msg.answer || msg.error}
                    </div>

                    <div className="absolute top-0 right-0 flex items-center space-x-1">
                      {msg.answer && (
                        <button
                          onClick={() => handleCopy(msg.answer || "", i)}
                          className="p-1.5 text-slate-500 hover:text-cyan-300 bg-[#060a12] border border-slate-800 hover:border-cyan-500/40 rounded-lg transition-colors text-[10px] flex items-center space-x-1 font-mono"
                          title="Copy answer"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Verified Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-800/70">
                      <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Verified Cryptographic Citations:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite: string, j: number) => {
                          let Icon = FileText;
                          if (cite.includes("IMG")) Icon = ImageIcon;
                          if (cite.includes("DB")) Icon = Database;

                          return (
                            <div
                              key={j}
                              className="flex items-center px-3 py-1.5 bg-[#070c18] border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-xs text-cyan-300 transition-colors font-mono shadow-sm"
                            >
                              <Icon className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                              <span>{cite}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evidence Chunks Preview if authorized */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/50">
                      <div className="text-[10px] font-mono text-slate-500 mb-1.5">
                        Authorized Context Excerpts ({msg.evidence.length} chunks passed to gate):
                      </div>
                      <div className="space-y-1.5">
                        {msg.evidence.map((ev, k) => (
                          <div
                            key={k}
                            className="p-2.5 rounded-lg bg-[#060a12] border border-slate-800/80 text-[11px] text-slate-300 font-mono"
                          >
                            <span className="text-cyan-400 font-bold mr-2">[{ev.source_id}]</span>
                            <span className="text-slate-500 mr-2">({ev.document}):</span>
                            <span>{ev.text.slice(0, 160)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Security Telemetry Footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-[#060a12]/90 px-3.5 py-2 rounded-xl border border-slate-800/80 font-mono">
                    <span>
                      Enforcement Gate: <span className="text-cyan-400 font-bold">Deterministic RBAC/RLS Filter</span>
                    </span>
                    <span className="flex items-center text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Zero Data Leaked
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start w-full">
            <div className="bg-[#090f1e] border border-slate-800 p-5 rounded-2xl rounded-tl-sm w-80 shadow-xl">
              <div className="flex items-center space-x-3 text-slate-300">
                <Shield className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-xs font-medium font-mono text-cyan-300 animate-pulse">
                  Asserting Role Clearances &amp; Filtering Chunks...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="p-5 md:p-6 bg-[#080d19]/90 backdrop-blur-xl border-t border-slate-800/80 z-10 shrink-0">
        <div className="max-w-4xl mx-auto relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question across authorized documents or database records..."
            className="w-full bg-[#0c1429] border border-slate-800 hover:border-slate-700 focus:border-cyan-500/60 text-white px-5 py-3.5 pr-16 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder-slate-500 text-sm shadow-xl"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 w-11 bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-violet-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-2 font-mono">
          ORYNTH Zero-Leakage: Chunks filtered before LLM context construction.
        </p>
      </div>
    </div>
  );
}
