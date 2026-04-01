"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, 
  TrendingDown, 
  Zap, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { motion } from "framer-motion";

interface Activity {
  carbon_equivalent: number;
}

export default function GoalsPage() {
  const [totalKg, setTotalKg] = useState(0);
  const [loading, setLoading] = useState(true);
  const annualBudget = 2000.0; // kg CO2e

  useEffect(() => {
    const fetchActivities = async () => {
        try {
            const res = await fetch("/api/activities");
            if (res.ok) {
                const data = await res.json();
                const total = data.reduce((sum: number, a: Activity) => sum + (a.carbon_equivalent || 0), 0);
                setTotalKg(total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchActivities();
    window.addEventListener('activity-logged', fetchActivities);
    return () => window.removeEventListener('activity-logged', fetchActivities);
  }, []);

  const budgetRemaining = annualBudget - totalKg;
  const budgetPct = (totalKg / annualBudget) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-playfair tracking-tight">Reduction Targets</h1>
          <p className="text-muted text-sm mt-1">Measuring your individual path to net zero.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-10 rounded-[40px] border border-white/40 dark:border-slate-700/50 shadow-sm relative overflow-hidden flex flex-col justify-between group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.05),transparent_50%)]" />
           
           <div className="relative z-10">
              <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-10">Carbon Debt Balance</h3>
              <div className="flex items-end gap-3 mb-4">
                 <span className="text-5xl font-bold text-foreground">{budgetRemaining.toFixed(1)}</span>
                 <span className="text-xl text-muted font-medium mb-1.5 italic">kg CO2e Left</span>
              </div>
              <p className="text-xs text-muted font-medium mb-10">Of your {annualBudget}kg individual budget allocation.</p>
              
              <div className="space-y-3">
                 <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted tracking-widest">
                    <span>Budget Utilized</span>
                    <span>{budgetPct.toFixed(1)}%</span>
                 </div>
                 <div className="w-full h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${budgetPct}%` }}
                        className="h-full bg-primary shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    />
                 </div>
              </div>
           </div>

           <div className="mt-12 p-5 bg-success/5 rounded-2xl border border-success/10 flex items-center gap-4 relative z-10 transition-transform group-hover:scale-[1.02]">
              <TrendingDown className="w-8 h-8 text-success" />
              <p className="text-xs text-muted leading-relaxed">
                You are currently <span className="text-success font-bold">12% below</span> the regional average debt. Maintaining this velocity ensures your 2024 goal.
              </p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group border border-slate-800 h-full flex flex-col justify-between">
              <div className="absolute top-[-20%] right-[-10%] opacity-5 group-hover:rotate-45 transition-transform duration-1000">
                <Target className="w-64 h-64" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary-light border border-white/10 shadow-xl">
                        <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Aether-Carbon Ledger Verification</span>
                </div>
                
                <h4 className="text-2xl font-playfair font-bold mb-4 italic">Next Reduction Goal</h4>
                <p className="text-white/60 text-sm leading-relaxed mb-10">
                  Target: 50kg reduction in Food emissions. Achieve this by opting for 4 more vegan alternatives this month.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-[10px] text-primary block mb-1 uppercase font-bold tracking-tighter">Current Velocity</span>
                        <span className="text-lg font-bold">8.4% Sav.</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-[10px] text-blue-400 block mb-1 uppercase font-bold tracking-tighter">Offset Potential</span>
                        <span className="text-lg font-bold">240kg</span>
                    </div>
                </div>
              </div>

              <button className="relative z-10 mt-10 w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all group/btn shadow-xl shadow-white/5">
                 Optimize Net-Zero Path
                 <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { icon: <Target />, label: "Precision", sub: "Data Integrity Check" },
            { icon: <Award />, label: "Compliance", sub: "Aether Standards" },
            { icon: <TrendingUp />, label: "Strategy", sub: "Behavioral Ledger" }
        ].map((item, i) => (
            <div key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-3xl border border-white/30 dark:border-slate-700/50 flex items-center gap-4 transition-all hover:bg-white/80 dark:hover:bg-slate-700 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                    {React.cloneElement(item.icon as React.ReactElement, { className: "w-5 h-5" })}
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted font-medium uppercase tracking-widest">{item.sub}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
