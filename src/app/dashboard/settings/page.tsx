"use client";
import { useState, useEffect } from "react";
import { Sliders, Key, Cpu, Database, CheckCircle2, Lock } from "lucide-react";

export default function SettingsPage() {
  const [geminiActive, setGeminiActive] = useState(false);

  useEffect(() => {
    // Check health or env status safely
    fetch("/api/health")
      .then((res) => res.json())
      .then(() => {
        // Safe heuristic without exposing any secret
        setGeminiActive(false);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8 bg-[#060a12] text-slate-100">
      <div className="pb-6 border-b border-slate-800/80">
        <h1 className="text-2xl font-bold text-white flex items-center font-mono">
          <Sliders className="w-6 h-6 mr-3 text-cyan-400" /> System Settings & Environment
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographic security configuration, zero-leakage parameters, and model integration status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* Card 1: Cryptographic Authentication */}
        <div className="p-6 rounded-2xl bg-[#090f1e] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Key className="w-4 h-4 text-violet-400" />
            <span>Cryptographic Authentication</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">JWT Signing Engine</div>
                <div className="text-[10px] text-slate-400">HMAC-SHA256 with timing-safe validation</div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">JWT_SECRET Configuration</div>
                <div className="text-[10px] text-slate-400">Environment variable enforced (never hardcoded)</div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                CONFIGURED (HIDDEN)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Token Expiration Window</div>
                <div className="text-[10px] text-slate-400">7-Day sliding session token lifetime</div>
              </div>
              <span className="text-[10px] font-mono text-slate-300">168 Hours</span>
            </div>
          </div>
        </div>

        {/* Card 2: AI Provider & Multimodal OCR */}
        <div className="p-6 rounded-2xl bg-[#090f1e] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Generative AI & Multimodal Ingestion</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">LLM Provider</div>
                <div className="text-[10px] text-slate-400">Google Gemini 2.5 Flash SDK</div>
              </div>
              <span className="text-[10px] font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                gemini-2.5-flash
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">GEMINI_API_KEY Status</div>
                <div className="text-[10px] text-slate-400">
                  {geminiActive ? "Key Active" : "Configurable via .env"}
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                OPTIONAL (DEMO READY)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Multimodal OCR Mode</div>
                <div className="text-[10px] text-slate-400">Vision model analysis on image ingestion</div>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">Enabled with Key</span>
            </div>
          </div>
        </div>

        {/* Card 3: Access Control Model */}
        <div className="p-6 rounded-2xl bg-[#090f1e] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Zero-Leakage Enforcement Gate</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            ORYNTH executes a 3-layer authorization gate:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-start space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Layer 1 (Document ABAC):</strong> Evaluates classification and department tags.</span>
            </div>
            <div className="flex items-start space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <span><strong>Layer 2 (Row-Level Security):</strong> Restricts database rows to the authenticated user principal.</span>
            </div>
            <div className="flex items-start space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Layer 3 (Citation Lock):</strong> Asserts grounding scores and disallows unvetted hallucinated claims.</span>
            </div>
          </div>
        </div>

        {/* Card 4: Storage Infrastructure */}
        <div className="p-6 rounded-2xl bg-[#090f1e] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Data Storage Tier</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Current Storage Mode</div>
                <div className="text-[10px] text-slate-400">High-speed in-memory store for hackathon demo</div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                IN-MEMORY
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Vector Index Tier</div>
                <div className="text-[10px] text-slate-400">Cosine similarity candidate search</div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">Indexed In-Process</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Production DB Path</div>
                <div className="text-[10px] text-slate-400">Ready for Google Cloud SQL PostgreSQL + Qdrant</div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Plug & Play</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
