"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, Camera, Check, ChevronRight, CircleAlert, Leaf, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import ManualEntryModal from "@/components/ManualEntryModal";
import { parseReceiptOCR } from "@/lib/ocr-engine";
import { saveActivity } from "@/app/actions/activity";
import { Category } from "@/lib/carbon-engine";

type DashboardSummary = {
  totals: {
    todayKg: number;
    monthKg: number;
    previousMonthKg: number;
    monthDeltaPct: number;
    rollingSevenDaysKg: number;
    entryCount: number;
  };
  budget: {
    monthlyTargetKg: number;
    budgetLeftKg: number;
  };
  topCategory: {
    category: string;
    kg: number;
    sharePct: number;
  };
  breakdown: Array<{
    category: string;
    kg: number;
    sharePct: number;
  }>;
  recentEntries: Array<{
    id: string;
    category: string;
    subcategory: string;
    carbon_equivalent: number;
    unit: string;
    raw_value: number;
    facility?: string | null;
    date: string;
    source: string;
  }>;
  trend: Array<{
    day: string;
    total: number;
  }>;
  streakDays: number;
  aiInsight: string;
  aiSource: string;
  user: {
    name: string;
    annualBudgetKg: number;
  };
};

type DraftItem = {
  id: string;
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  carbon_equivalent: number;
  insight_hint?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  TRANSPORT: "bg-emerald-500",
  ENERGY: "bg-sky-500",
  FOOD: "bg-amber-500",
  WASTE: "bg-rose-500",
  SHOPPING: "bg-teal-500",
  WATER: "bg-cyan-500",
  NONE: "bg-slate-400",
};

function formatCategory(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/calculate-emissions", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load dashboard");
      }
      startTransition(() => {
        setSummary(payload);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const handleManualSave = async (data: {
    category: Category;
    subcategory: string;
    value: number;
    unit: string;
    facility: string;
    date: string;
    source: "MANUAL" | "OCR" | "API";
  }) => {
    await saveActivity(data);
    setIsManualModalOpen(false);
    await refreshDashboard();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await parseReceiptOCR(base64);

        if (!result?.activities?.length) {
          setScanError("The AI scanner could not extract line items from this image. Try a clearer receipt photo.");
          setIsScanning(false);
          return;
        }

        setDrafts(
          result.activities.map((item, index) => ({
            id: `draft-${Date.now()}-${index}`,
            category: item.category,
            subcategory: item.subcategory,
            value: item.value,
            unit: item.unit,
            carbon_equivalent: item.carbon_equivalent,
            insight_hint: item.insight_hint,
          })),
        );
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setScanError("Receipt scanning failed. Please try again or use manual entry.");
      setIsScanning(false);
    }
  };

  const confirmDraft = async (draft: DraftItem) => {
    await saveActivity({
      category: draft.category as Category,
      subcategory: draft.subcategory,
      value: draft.value,
      unit: draft.unit,
      date: new Date().toISOString(),
      source: "OCR",
    });
    setDrafts((current) => current.filter((item) => item.id !== draft.id));
    await refreshDashboard();
  };

  const breakdown = useMemo(() => summary?.breakdown || [], [summary]);
  const topBarMax = useMemo(() => Math.max(...breakdown.map((item) => item.kg), 1), [breakdown]);

  if (isLoading && !summary) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="glass-panel rounded-[32px] p-8">
        <p className="text-lg font-semibold">Dashboard data is unavailable right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section id="quick-add" className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_32px_120px_rgba(15,23,42,0.22)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.22),transparent_35%)]" />
          <div className="relative space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Primary control center</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight">Track, analyze, and improve from one dashboard.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                  The landing experience now flows directly into this command center. Add entries, scan receipts, review AI suggestions,
                  and move into goals without switching to a disconnected ledger page.
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/goals")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Optimize net-zero path
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:opacity-70"
              >
                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {isScanning ? "Scanning receipt..." : "Scan receipt"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Add activity manually
              </button>
            </div>

            {scanError && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <CircleAlert className="h-4 w-4" />
                {scanError}
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[36px] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Executive summary</p>
              <h3 className="mt-3 text-2xl font-semibold">Real-time carbon snapshot</h3>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              {summary.aiSource === "groq" ? "AI generated" : "Fallback ready"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">This month</p>
              <p className="mt-3 text-3xl font-semibold">{summary.totals.monthKg.toFixed(1)} kg</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Top category</p>
              <p className="mt-3 text-3xl font-semibold">{formatCategory(summary.topCategory.category)}</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Change vs previous month</p>
              <p className="mt-3 text-3xl font-semibold">{summary.totals.monthDeltaPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Budget left</p>
              <p className="mt-3 text-3xl font-semibold">{summary.budget.budgetLeftKg.toFixed(1)} kg</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-emerald-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Personalized insight</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{summary.aiInsight}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Today", value: `${summary.totals.todayKg.toFixed(1)} kg`, accent: "Today footprint" },
          { label: "7-day total", value: `${summary.totals.rollingSevenDaysKg.toFixed(1)} kg`, accent: "Rolling trend" },
          { label: "Entries logged", value: `${summary.totals.entryCount}`, accent: "Ledger points" },
          { label: "Active streak", value: `${summary.streakDays} days`, accent: "Consistency" },
        ].map((item) => (
          <div key={item.label} className="glass-panel rounded-[30px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{item.accent}</p>
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[36px] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Category breakdown</p>
              <h3 className="mt-3 text-2xl font-semibold">What is driving emissions</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mt-6 space-y-4">
            {breakdown.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300/70 px-5 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                No emission data yet. Add your first activity to unlock the real-time breakdown.
              </div>
            )}
            {breakdown.map((item) => (
              <div key={item.category} className="rounded-3xl bg-white/70 p-4 dark:bg-slate-900/45">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{formatCategory(item.category)}</span>
                  <span>{item.kg.toFixed(1)} kg</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-3 rounded-full ${CATEGORY_COLORS[item.category] || "bg-slate-400"}`}
                    style={{ width: `${Math.max((item.kg / topBarMax) * 100, 10)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{item.sharePct.toFixed(1)}% of this month</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[36px] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Recent entries</p>
              <h3 className="mt-3 text-2xl font-semibold">Latest verified activity</h3>
            </div>
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />}
          </div>

          <div className="mt-6 space-y-3">
            {summary.recentEntries.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300/70 px-5 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Your ledger is empty right now. Use Quick Add above to start the live timeline.
              </div>
            )}
            {summary.recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-3xl bg-white/70 px-5 py-4 dark:bg-slate-900/45">
                <div>
                  <p className="text-sm font-semibold">{formatCategory(entry.category)} / {formatCategory(entry.subcategory)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {entry.facility || "General entry"} • {new Date(entry.date).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{entry.carbon_equivalent.toFixed(2)} kg</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{entry.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[36px] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Draft review</p>
              <h3 className="mt-3 text-2xl font-semibold">Receipt scan verification</h3>
            </div>
            <Leaf className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mt-6 space-y-3">
            {drafts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300/70 px-5 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Scanned receipt items will appear here for review before they enter the ledger.
              </div>
            )}
            {drafts.map((draft) => (
              <div key={draft.id} className="rounded-3xl bg-white/70 p-4 dark:bg-slate-900/45">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{formatCategory(draft.category)} / {formatCategory(draft.subcategory)}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {draft.value} {draft.unit} • {draft.carbon_equivalent.toFixed(2)} kg
                    </p>
                    {draft.insight_hint && (
                      <p className="mt-3 text-xs leading-6 text-emerald-700 dark:text-emerald-300">{draft.insight_hint}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => confirmDraft(draft)}
                      className="rounded-full bg-emerald-500 p-2 text-slate-950 transition hover:-translate-y-0.5"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}
                      className="rounded-full bg-rose-500 p-2 text-white transition hover:-translate-y-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[36px] p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">7-day rhythm</p>
              <h3 className="mt-3 text-2xl font-semibold">Weekly pulse</h3>
            </div>
            <button
              onClick={() => router.push("/dashboard/analytics")}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-slate-100"
            >
              Open analytics
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-3">
            {summary.trend.map((item) => {
              const height = Math.max((item.total / Math.max(...summary.trend.map((bar) => bar.total), 1)) * 160, 14);
              return (
                <div key={item.day} className="flex flex-col items-center gap-3">
                  <div className="flex h-44 items-end">
                    <div className="w-10 rounded-t-2xl bg-gradient-to-t from-emerald-500 to-cyan-400" style={{ height }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{item.day}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.total.toFixed(1)} kg</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ManualEntryModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onSave={handleManualSave} />
    </div>
  );
}
