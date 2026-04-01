"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, FileDown, FileText, Loader2, Sparkles } from "lucide-react";

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportData, setReportData] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setReportData(null);

    try {
      const response = await fetch("/api/generate-report", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate report");
      }

      setReportData(payload.markdown);
      setSource(payload.source || "groq");
    } catch (err) {
      console.error(err);
      setError("Report generation failed. The route could not prepare an audit summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    const node = reportRef.current;
    if (!node) return;

    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new JsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Aether-Carbon-Audit-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      setError("PDF export failed. Try generating the report again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!reportData ? (
        <div className="glass-panel flex min-h-[60vh] flex-col items-center justify-center rounded-[36px] px-6 py-12 text-center">
          <div className="rounded-[28px] bg-emerald-500/10 p-6 text-emerald-600 dark:text-emerald-300">
            {isGenerating ? <Loader2 className="h-10 w-10 animate-spin" /> : <FileText className="h-10 w-10" />}
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Generate an AI carbon audit</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Reports now run through the stabilized backend route with graceful fallback output if the external model is unavailable.
          </p>

          {error && <div className="mt-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating report..." : "Generate report"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[30px] p-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              Report ready {source === "fallback" ? "(fallback mode)" : "(AI mode)"}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReportData(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10">
                Discard
              </button>
              <button
                onClick={downloadPDF}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {isDownloading ? "Exporting..." : "Download PDF"}
              </button>
            </div>
          </div>

          {error && <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

          <div className="glass-panel rounded-[36px] p-6">
            <div ref={reportRef} className="prose max-w-none rounded-[28px] bg-white p-8 prose-headings:font-semibold prose-h1:text-slate-950 prose-h2:text-slate-900 prose-p:text-slate-700">
              <ReactMarkdown>{reportData}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
