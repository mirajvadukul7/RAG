"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  MessageSquare,
  FileText,
  Activity,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Lock,
  Menu,
  X,
  UserCheck,
  KeyRound,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role_id: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) setUser(data);
        else router.push("/");
      })
      .catch(() => router.push("/"));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleQuickSwitch = async (targetUser: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: targetUser, password: "password123" }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        setShowRoleSwitcher(false);
        window.location.reload();
      }
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a12] text-slate-400">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="font-mono text-sm tracking-wider text-slate-300">
            INITIALIZING ORYNTH SECURE CONTEXT...
          </span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Secure Chat", href: "/dashboard/chat", icon: MessageSquare },
    { label: "Documents", href: "/dashboard/documents", icon: FileText },
    { label: "Access Control", href: "/dashboard/access", icon: KeyRound },
    { label: "Security Lab", href: "/dashboard/admin", icon: ShieldAlert },
    { label: "Audit Logs", href: "/dashboard/security", icon: Activity },
    { label: "Settings", href: "/dashboard/settings", icon: Sliders },
  ];

  const demoRoles = [
    { id: "admin", label: "Admin", role: "ADMIN", desc: "Full Access" },
    { id: "employee_user", label: "Employee", role: "EMPLOYEE", desc: "Public Docs Only" },
    { id: "hr_user", label: "HR Lead", role: "HR", desc: "HR Confidential" },
    { id: "finance_user", label: "Finance", role: "FINANCE", desc: "Invoices & Ledger" },
  ];

  return (
    <div className="flex h-screen bg-[#060a12] overflow-hidden text-slate-100">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0a0f1d] border-b border-slate-800/80 px-4 flex items-center justify-between z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px]">
            <div className="w-full h-full bg-[#0b101f] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-sm tracking-tight text-white font-mono">ORYNTH</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
            {user.role_id}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:flex flex-col w-64 bg-[#080d19] border-r border-slate-800/80 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center space-x-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-[#0b101f] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-white font-mono tracking-tight">ORYNTH</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v1.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight truncate">
              Secure Multimodal RAG
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            System Modules
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600/25 to-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Engine Status */}
        <div className="p-4 border-t border-slate-800/80 bg-[#060a14]/90 space-y-3">
          {/* Quick Role Switcher for Hackathon Mentors */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="w-full px-2.5 py-1.5 bg-[#0e162b] hover:bg-[#121c38] border border-slate-800/80 rounded-lg text-[10px] text-slate-300 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center truncate">
                <UserCheck className="w-3 h-3 mr-1.5 text-cyan-400 shrink-0" />
                <span className="truncate">Switch Role: <strong className="text-cyan-300">{user.role_id}</strong></span>
              </span>
              <span className="text-[9px] text-slate-500 font-mono shrink-0">TEST ▾</span>
            </button>

            {showRoleSwitcher && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 p-2 bg-[#0d1428] border border-slate-700/80 rounded-xl shadow-2xl space-y-1 z-30">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">
                  1-Click Role Switch:
                </div>
                {demoRoles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleQuickSwitch(r.id)}
                    className={`w-full text-left p-1.5 rounded-lg text-[10px] flex items-center justify-between transition-colors ${
                      user.username === r.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "hover:bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    <div>
                      <span className="font-bold">{r.label}</span>
                      <span className="text-[8px] text-slate-500 block">{r.desc}</span>
                    </div>
                    <span className="font-mono text-[8px] text-slate-400">{r.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-2.5 py-1.5 bg-[#0b1020] border border-slate-800/80 rounded-lg text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Pre-LLM RBAC Gate
            </span>
            <span className="text-emerald-400 font-mono text-[9px] font-bold">ENFORCED</span>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-white truncate">{user.username}</span>
              <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
                <Lock className="w-2.5 h-2.5 mr-1 text-violet-400 shrink-0" />
                Clearance: <span className="ml-1 font-mono text-cyan-300 font-bold">{user.role_id}</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#060a12] pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
