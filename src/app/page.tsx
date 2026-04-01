"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Leaf } from "lucide-react";
import HeroCanvas from "@/components/HeroCanvas";
import SpotlightCard from "@/components/SpotlightCard";
import LandingAuthModal from "@/components/LandingAuthModal";

type ModalMode = "signin" | "signup";

export default function Home() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("signup");
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 32;
      const y = (event.clientY / window.innerHeight - 0.5) * 32;
      setPointer({ x, y });
    };

    const handleScroll = () => {
      const max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / max)));
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    const auth = new URL(window.location.href).searchParams.get("auth");
    if (auth === "signin" || auth === "signup") {
      openModal(auth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (mode: ModalMode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const features = useMemo(
    () => [
      {
        title: "Real-time Carbon Ledger",
        body: "Log transport, energy, food, water, waste, and shopping with consistent units and clean category mapping.",
        tint: "bg-[#1B6C42]/10",
        icon: "🌿",
      },
      {
        title: "AI Insight Engine",
        body: "Generate grounded insights from your own data with fallback summaries when the external model is unavailable.",
        tint: "bg-[#D97706]/10",
        icon: "✨",
      },
      {
        title: "Receipt Scan Intake",
        body: "Upload a receipt and review extracted line items in a draft feed before saving to the ledger.",
        tint: "bg-[#14B8A6]/10",
        icon: "📷",
      },
      {
        title: "Executive Audit Reports",
        body: "Create a markdown audit report and export it to PDF on demand without bloating the initial bundle.",
        tint: "bg-[#3B82F6]/10",
        icon: "📄",
      },
      {
        title: "Goals and Budget Tracking",
        body: "Keep a monthly target and see budget left, top source, and month-over-month change in one place.",
        tint: "bg-[#EF4444]/10",
        icon: "🎯",
      },
      {
        title: "Unified Dashboard Flow",
        body: "Landing and dashboard share the same visual language so the transition feels like one product.",
        tint: "bg-gray-200/60",
        icon: "🧠",
      },
    ],
    [],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#E9EFED] text-[#111827] selection:bg-[#1B6C42]/20 selection:text-[#111827]">
      <div className="ambient-glow" />
      <div className="pointer-events-none fixed inset-0 opacity-90">
        <div
          className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/70 blur-3xl"
          style={{ transform: `translate(${pointer.x * 0.4}px, ${pointer.y * 0.25}px)` }}
        />
        <div
          className="absolute right-0 top-32 h-80 w-80 rounded-full bg-white/45 blur-3xl"
          style={{ transform: `translate(${-pointer.x * 0.35}px, ${pointer.y * 0.18}px)` }}
        />
      </div>

      <nav className="fixed top-0 w-full z-50 bg-[#E9EFED]/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <Leaf className="w-5 h-5 text-[#1B6C42]" />
            </div>
            <span className="font-playfair text-xl font-semibold tracking-tight text-[#111827]">Aether Carbon</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => openModal("signin")}
              className="text-gray-500 hover:text-gray-900 font-medium text-sm tracking-wide transition-all duration-300 mr-6 hidden sm:block"
            >
              Sign In
            </button>
            <button
              onClick={() => openModal("signup")}
              className="relative overflow-hidden group bg-[#1B6C42] text-white px-7 py-2.5 rounded-full font-medium text-sm tracking-wide shadow-sm hover:shadow-md transition-all duration-400 hover:scale-[1.04] active:scale-[0.97] btn-shimmer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <HeroCanvas />

        <div className="absolute inset-0 z-10 hidden lg:block pointer-events-none">
          <div
            className="floating-card absolute top-[20%] left-[12%] w-56 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-sm p-5"
            style={{ transform: `translate(${pointer.x * 0.18}px, ${pointer.y * 0.12}px) rotate(-6deg)` }}
          >
            <span className="font-mono text-xs text-[#3B82F6] font-medium block mb-3">Monthly Budget</span>
            <div className="h-1 rounded-full bg-gray-100 w-full overflow-hidden mb-2">
              <div className="h-full bg-[#3B82F6] w-[55%] rounded-full" />
            </div>
            <span className="text-xs text-gray-400 block">55% remaining</span>
          </div>

          <div
            className="floating-card absolute top-[28%] right-[12%] w-56 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-sm p-5"
            style={{ transform: `translate(${-pointer.x * 0.15}px, ${pointer.y * 0.14}px) rotate(4deg)` }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1B6C42]" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">On target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">High week</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Risk zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">No data</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-6">
          <div className="inline-flex items-center gap-2.5 bg-white border border-gray-200 shadow-sm rounded-full px-5 py-2">
            <div className="w-2 h-2 rounded-full bg-[#1B6C42] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500 font-medium">AI-Powered Carbon Tracking</span>
          </div>

          <h1 className="font-playfair text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-semibold text-[#111827] leading-[0.9] tracking-tight mt-8">
            <span>Grow Your</span>
            <br />
            <span className="bg-gradient-to-r from-[#1B6C42] via-[#2D8F5C] to-[#1B6C42] bg-clip-text text-transparent animate-gradient-shift">
              Impact
            </span>
          </h1>

          <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto mt-7 leading-relaxed tracking-wide font-light">
            Track emissions in real time, understand what drives them, and get practical AI guidance based on your own activity ledger.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 items-center justify-center">
            <button
              onClick={() => openModal("signup")}
              className="relative overflow-hidden group bg-[#1B6C42] text-white px-10 py-4 rounded-full font-medium text-base tracking-wide shadow-md hover:shadow-lg hover:bg-[#155A35] transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] btn-shimmer"
            >
              Get Started
            </button>
            <a
              href="#features"
              className="bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-10 py-4 rounded-full font-medium text-base shadow-sm transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              See What&apos;s Inside <span className="ml-1 opacity-50">↓</span>
            </a>
          </div>

          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-70">
            <div className="w-[1px] h-14 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
            <span className="font-mono text-xs tracking-[0.4em] text-gray-400">SCROLL</span>
            <div className="rounded-full bg-white border border-gray-200 p-2">
              <ArrowDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative py-32 bg-[#E9EFED] z-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="font-mono text-xs tracking-[0.3em] text-[#1B6C42] uppercase font-medium">Features</span>
            <h2 className="font-playfair text-4xl md:text-6xl font-semibold text-[#111827] mt-4 leading-tight tracking-tight">
              Everything You Need
              <br />
              to Track Smarter
            </h2>
            <p className="text-gray-500 text-lg mt-6 max-w-lg mx-auto font-light leading-relaxed">
              A real product flow: intake, verification, analytics, goals, and audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <SpotlightCard
                key={feature.title}
                className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm transition-all duration-500 hover:border-gray-300 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              >
                <div className={`icon-container w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.tint}`}>
                  <span className="text-xl">{feature.icon}</span>
                </div>
                <h3 className="text-[#111827] font-medium text-lg mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light">{feature.body}</p>
              </SpotlightCard>
            ))}
          </div>

          <div className="mt-16 flex items-center justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-8 py-4 rounded-full font-medium text-base shadow-sm transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore the dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-[#E9EFED] py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[#1B6C42]" />
            <span className="font-playfair text-lg font-semibold">Aether Carbon</span>
          </div>
          <div className="text-sm text-gray-500 font-light">
            Built with glassmorphism, parallax, and real authentication.
          </div>
        </div>
      </footer>

      <div className="fixed left-0 top-0 h-1 bg-[#1B6C42]/30 z-[60]" style={{ width: `${scrollProgress * 100}%` }} />

      <LandingAuthModal
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
        onModeChange={(next) => setModalMode(next)}
      />
    </main>
  );
}
