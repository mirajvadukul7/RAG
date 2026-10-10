"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, ChevronRight, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customUser?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const targetUser = customUser || username;
    const targetPassword = customUser ? "password123" : password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: targetUser, password: targetPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Authentication rejected: Invalid username or password.");
      }
    } catch {
      setError("Gateway error: Failed to communicate with authentication authority.");
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { label: "Admin", user: "admin", desc: "Full RAG + System Lab Access", color: "border-violet-500/40 text-violet-300 bg-violet-500/10" },
    { label: "Staff", user: "employee_user", desc: "Engineering / Public Documents", color: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10" },
    { label: "HR Lead", user: "hr_user", desc: "HR Confidential Clearance", color: "border-pink-500/40 text-pink-300 bg-pink-500/10" },
    { label: "Finance", user: "finance_user", desc: "Financial Invoices & Ledger", color: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060a12] relative overflow-hidden px-4">
      {/* Background Lighting Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-[#0c1222]/90 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 mb-4">
            <div className="w-full h-full bg-[#0b101f] rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 border border-violet-500/30 text-violet-300 mb-3">
            <Sparkles className="w-3 h-3 mr-1.5 text-cyan-400" /> Enterprise Cybersecurity RAG
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">ORYNTH</h1>
          <p className="text-slate-400 mt-2 text-xs">Secure Intelligence. Controlled Access.</p>
        </div>

        {error && (
          <div className="p-3 mb-6 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* 1-Click Demo Profiles for Mentors */}
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            1-Click Demo Role Profiles:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickRoles.map((r) => (
              <button
                key={r.user}
                type="button"
                onClick={() => {
                  setUsername(r.user);
                  setPassword("password123");
                  handleLogin(undefined, r.user);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${r.color}`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  {r.label}
                  <CheckCircle2 className="w-3 h-3 opacity-60" />
                </div>
                <div className="text-[10px] opacity-75 truncate">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1">Username / Identity</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#080d19] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm"
              placeholder="admin, hr_user, employee_user..."
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-[#080d19] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-mono px-1">
              Standard demo password for all roles: <code className="text-cyan-400">password123</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-medium rounded-xl transition-all flex items-center justify-center group mt-4 shadow-lg shadow-violet-900/30 text-sm disabled:opacity-50"
          >
            {loading ? "Verifying Cryptographic Credentials..." : "Authenticate Session"}
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-[11px] text-center text-slate-500 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Zero-Leakage Cryptographic Access Control Active
        </div>
      </div>
    </div>
  );
}
