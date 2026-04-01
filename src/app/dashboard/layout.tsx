"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, Home, LayoutDashboard, LogOut, Moon, Settings, SunMedium, Target } from "lucide-react";
import { usePathname } from "next/navigation";

const AIChatbot = dynamic(() => import("@/components/AIChatbot"), { ssr: false });

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const pageLabel = useMemo(
    () => NAV_ITEMS.find((item) => pathname === item.href)?.label || "Dashboard",
    [pathname],
  );

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          setUserName(data.user?.name ?? null);
          setUserEmail(data.user?.email ?? null);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e6f7ef_0%,#f4f8fb_45%,#eff6ff_100%)] text-slate-950 transition-colors dark:bg-[radial-gradient(circle_at_top,#0f2b1f_0%,#07111f_45%,#020617_100%)] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
      </div>

      <aside
        className={`glass-panel fixed inset-y-0 left-0 z-40 flex border-r border-white/40 px-5 py-6 transition-all dark:border-white/10 ${
          isSidebarOpen ? "w-72" : "w-24"
        }`}
      >
        <div className="flex w-full flex-col">
          <Link href="/" className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-emerald-500">
              <Home className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <div>
                <p className="text-lg font-semibold">Aether Carbon</p>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">AI sustainability assistant</p>
              </div>
            )}
          </Link>

          <nav className="mt-10 flex-1 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-950 text-white shadow-lg dark:bg-emerald-500 dark:text-slate-950"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-3xl border border-white/50 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
            {isSidebarOpen && (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Status</p>
                <p className="mt-3 text-sm font-semibold">{userName ?? "Signed in"}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{userEmail ?? "Loading profile..."}</p>
                <button
                  onClick={logout}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className={`relative transition-all ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <header className="sticky top-0 z-30 border-b border-white/40 bg-white/45 px-6 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen((current) => !current)}
                className="glass-panel rounded-2xl p-2 text-slate-700 transition hover:-translate-y-0.5 dark:text-slate-100"
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Current view</p>
                <h1 className="text-2xl font-semibold">{pageLabel}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard#quick-add"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-emerald-500 dark:text-slate-950"
              >
                Quick Add
              </Link>
              <button
                onClick={toggleTheme}
                className="glass-panel rounded-2xl p-2 text-slate-700 transition hover:-translate-y-0.5 dark:text-slate-100"
              >
                {isDark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        <div className="relative z-10 px-6 py-8 lg:px-8">{children}</div>
      </main>

      <AIChatbot />
    </div>
  );
}
