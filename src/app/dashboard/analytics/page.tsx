"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, TrendingUp } from "lucide-react";

type AnalyticsSummary = {
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
  trend: Array<{
    day: string;
    total: number;
  }>;
  aiInsight: string;
};

function formatCategory(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/calculate-emissions", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load analytics");
        }
        setSummary(payload);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const trendMax = useMemo(
    () => Math.max(...(summary?.trend.map((item) => item.total) || [1]), 1),
    [summary],
  );

  if (loading && !summary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!summary) {
    return <div className="glass-panel rounded-[32px] p-8">Analytics data is unavailable right now.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="glass-panel rounded-[36px] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Trend analysis</p>
          <h2 className="mt-3 text-3xl font-semibold">7-day emissions rhythm</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            The executive summary card is now driven from backend aggregation instead of fixed placeholder copy.
          </p>

          <div className="mt-8 grid grid-cols-7 gap-3">
            {summary.trend.map((item) => (
              <div key={item.day} className="flex flex-col items-center gap-3">
                <div className="flex h-44 items-end">
                  <div
                    className="w-10 rounded-t-2xl bg-gradient-to-t from-sky-500 to-emerald-400"
                    style={{ height: Math.max((item.total / trendMax) * 160, 14) }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{item.day}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.total.toFixed(1)} kg</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_32px_120px_rgba(15,23,42,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Executive summary</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Monthly footprint</p>
              <p className="mt-2 text-3xl font-semibold">{summary.totals.monthKg.toFixed(1)} kg</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Top category</p>
              <p className="mt-2 text-3xl font-semibold">{formatCategory(summary.topCategory.category)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Previous month</p>
              <p className="mt-2 text-3xl font-semibold">{summary.totals.previousMonthKg.toFixed(1)} kg</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Budget left</p>
              <p className="mt-2 text-3xl font-semibold">{summary.budget.budgetLeftKg.toFixed(1)} kg</p>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
            {summary.totals.monthDeltaPct <= 0 ? <ArrowDownRight className="h-4 w-4 text-emerald-300" /> : <ArrowUpRight className="h-4 w-4 text-amber-300" />}
            {summary.totals.monthDeltaPct.toFixed(1)}% vs previous month
          </div>

          <div className="mt-6 rounded-3xl bg-white/10 p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">AI summary</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">{summary.aiInsight}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Category intensity</p>
        <h3 className="mt-3 text-2xl font-semibold">Where emissions are concentrated</h3>
        <div className="mt-8 space-y-4">
          {summary.breakdown.map((item) => (
            <div key={item.category} className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{formatCategory(item.category)}</span>
                <span>{item.kg.toFixed(1)} kg</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${Math.max(item.sharePct, 8)}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.sharePct.toFixed(1)}% share of the current month</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
