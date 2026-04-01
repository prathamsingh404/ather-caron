"use client";

import React, { useState, useMemo, useCallback } from "react";
import { 
  Car, 
  Zap, 
  Utensils, 
  Trash2, 
  ShoppingBag, 
  Droplets,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  X,
  Loader2,
  Camera,
  Sparkles,
  ArrowRightLeft
} from "lucide-react";
import { Category, EMISSION_FACTORS } from "@/lib/carbon-engine";
import { LogicGuard, OptimizationResult } from "@/lib/logic-guard";
import { saveActivity } from "@/app/actions/activity";
import { parseReceiptOCR } from "@/lib/ocr-engine";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "TRANSPORT", label: "Transport", icon: <Car />, color: "bg-primary" },
  { id: "ENERGY", label: "Energy", icon: <Zap />, color: "bg-blue-500" },
  { id: "FOOD", label: "Food", icon: <Utensils />, color: "bg-orange-500" },
  { id: "WASTE", label: "Waste", icon: <Trash2 />, color: "bg-red-500" },
  { id: "SHOPPING", label: "Shopping", icon: <ShoppingBag />, color: "bg-teal-500" },
  { id: "WATER", label: "Water", icon: <Droplets />, color: "bg-secondary" },
];

interface ActivityLoggerProps {
  onClose: () => void;
}

const ActivityLogger: React.FC<ActivityLoggerProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<string>("");
  const [value, setValue] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [source, setSource] = useState<"MANUAL" | "OCR" | "API">("MANUAL");

  const selectedCategoryFactors = useMemo(() => {
    return category ? EMISSION_FACTORS[category] : [];
  }, [category]);

  const activeUnit = useMemo(() => {
    return selectedCategoryFactors.find(f => f.subcategory === subcategory)?.unit || "unit";
  }, [selectedCategoryFactors, subcategory]);

  // Aether-Carbon DEI: Fetch optimization delta live
  const updateOptimization = useCallback(async (cat: Category, sub: string, val: number) => {
    if (val > 0) {
      const res = await LogicGuard.getOptimization(cat, sub, val);
      setOptimization(res);
    } else {
      setOptimization(null);
    }
  }, []);

  const handleNext = async () => {
    if (step === 3 && category && subcategory && value > 0) {
      await updateOptimization(category, subcategory, value);
    }
    setStep(s => s + 1);
  };
  
  const handleBack = () => setStep(s => s - 1);

  // Phase 3: Groq Neural OCR Logic
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await parseReceiptOCR(base64);
        
        if (res && res.activities.length > 0) {
          const item = res.activities[0]; // Take first item for demo
          setCategory(item.category as Category);
          setSubcategory(item.subcategory);
          setValue(item.value);
          setSource("OCR");
          setNote(`Analyzed via AI Vision: ${item.name}`);
          setStep(3); // Jump to quantity step
        }
      };
    } catch (err) {
      console.error("OCR Failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  });

  const handleSave = async () => {
    if (!category || !subcategory || value <= 0) return;
    setIsSaving(true);
    try {
      await saveActivity({ category, subcategory, value, unit: activeUnit, date, note, source });
      setSaveSuccess(true);
      setTimeout(() => {
        window.dispatchEvent(new Event('activity-logged'));
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold font-playfair text-foreground flex items-center gap-2">
            {source === "OCR" && <Sparkles className="w-5 h-5 text-primary" />}
            Log Activity
          </h2>
          <p className="text-xs text-muted font-medium">Step {step} of 4</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-muted" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex h-1 w-full bg-gray-100 dark:bg-slate-800">
        <motion.div 
          className="h-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          initial={{ width: "25%" }}
          animate={{ width: `${step * 25}%` }}
        />
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
        <AnimatePresence mode="wait">
          {saveSuccess ? (
             <motion.div 
               key="success"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center justify-center h-full space-y-6"
             >
               <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-success border-4 border-success/20 shadow-xl"
               >
                 <CheckCircle2 className="w-12 h-12" />
               </motion.div>
               <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold font-playfair">Ledger Updated!</h3>
                <p className="text-muted text-sm max-w-[250px]">Aether-Carbon has verified the emission and updated your profile.</p>
               </div>
             </motion.div>
          ) : step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* OCR Scanning Trigger */}
              <div {...getRootProps()} className={`relative cursor-pointer transition-all ${isDragActive ? 'scale-95' : ''}`}>
                <input {...getInputProps()} />
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 border-2 border-dashed border-primary/30 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 hover:border-primary transition-colors group">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    {isAnalyzing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-foreground">{isAnalyzing ? "AI Analyzing..." : "Scan Receipt (AI Vision)"}</h4>
                    <p className="text-xs text-muted mt-1 uppercase tracking-widest font-semibold">Fastest Data Intake</p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-muted uppercase tracking-widest">Or Manual</span>
                <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); handleNext(); }}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group ${
                      category === cat.id ? "border-primary bg-primary/5" : "border-gray-100 dark:border-slate-800 hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${cat.color} text-white shadow-lg`}>
                      {cat.icon}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : step === 2 ? (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-6">Refine Intelligence</h3>
              <div className="space-y-4">
                {selectedCategoryFactors.map((f) => (
                  <button
                    key={f.subcategory}
                    onClick={() => { setSubcategory(f.subcategory); handleNext(); }}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${
                      subcategory === f.subcategory ? "border-primary bg-primary/5 shadow-inner" : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${subcategory === f.subcategory ? 'bg-primary animate-pulse' : 'bg-gray-300 dark:bg-slate-700'}`} />
                      <span className="text-sm font-bold text-foreground capitalize">
                        {f.subcategory.replace(/_/g, " ")}
                      </span>
                    </div>
                    {subcategory === f.subcategory && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : step === 3 ? (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <label className="block text-xs font-bold text-muted mb-4 uppercase tracking-widest">Entry Volume</label>
                <div className="relative">
                  <input
                    type="number"
                    value={value || ""}
                    onChange={(e) => {
                       const val = parseFloat(e.target.value);
                       setValue(val);
                    }}
                    className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary/30 rounded-3xl p-6 text-4xl font-bold outline-none transition-all"
                    placeholder="0.00"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted font-bold text-lg">
                    {activeUnit}
                  </div>
                </div>
              </div>

              {optimization && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-3 text-primary/10 transition-transform group-hover:rotate-12">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-primary font-bold mb-4">
                    <ArrowRightLeft className="w-4 h-4 ml-0.5" />
                    <span className="text-[10px] uppercase tracking-widest">Aether Optimization Insight</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-white leading-tight">
                      {optimization.current_carbon_kg} <span className="text-sm font-medium text-slate-400 italic">kg CO₂e load</span>
                    </div>
                    {optimization.carbon_saved_kg > 0 && (
                      <p className="text-primary text-sm font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Save {optimization.carbon_saved_kg}kg with recommended alternative
                      </p>
                    )}
                  </div>
                  
                  {optimization.recommendation && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-slate-400 text-xs leading-relaxed italic">
                        &quot;{optimization.recommendation}&quot;
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : step === 4 ? (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-bold text-muted mb-4 uppercase tracking-widest">Temporal Context</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl p-5 pl-14 text-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-4 uppercase tracking-widest">Neural Context (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl p-5 text-foreground font-medium outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none"
                  placeholder="Annotate this debt item..."
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0f172a] relative z-20">
        {!saveSuccess && step > 1 ? (
          <button 
            onClick={handleBack}
            disabled={isSaving}
            className="flex items-center gap-2 text-sm font-bold text-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        ) : <div />}

        {!saveSuccess && step < 4 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 && !category || step === 2 && !subcategory || (step === 3 && value <= 0) || isSaving}
            className="bg-primary text-white px-8 py-4 rounded-3xl font-bold text-sm flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isAnalyzing ? "Processing..." : "Continue"}
            {!isAnalyzing && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        ) : !saveSuccess ? (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-white px-10 py-4 rounded-3xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {isSaving ? "Syncing..." : "Finalize Entry"}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ActivityLogger;
