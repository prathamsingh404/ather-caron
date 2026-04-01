"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

type Props = {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onModeChange: (mode: Mode) => void;
};

export default function LandingAuthModal({ isOpen, mode, onClose, onModeChange }: Props) {
  const router = useRouter();
  const isSignInMode = mode === "signin";
  const title = useMemo(() => (isSignInMode ? "Welcome back" : "Welcome to Aether Carbon"), [isSignInMode]);
  const subtitle = useMemo(() => (isSignInMode ? "Sign in to continue" : "Start tracking your footprint"), [isSignInMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, mode]);

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const endpoint = isSignInMode ? "/api/auth/login" : "/api/auth/signup";
      const payload = isSignInMode ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Authentication failed");
      }

      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          className="relative w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>

          <h3 className="font-playfair text-2xl font-semibold text-[#111827] text-center tracking-tight">{title}</h3>
          <p className="text-gray-500 text-center text-sm mt-2 font-light">{subtitle}</p>

          <div className="mt-8 space-y-3">
            {!isSignInMode && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-gray-50 border border-gray-200 focus:border-[#1B6C42] focus:ring-2 focus:ring-[#1B6C42]/20 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 w-full outline-none transition-all text-sm"
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="your@email.com"
              className="bg-gray-50 border border-gray-200 focus:border-[#1B6C42] focus:ring-2 focus:ring-[#1B6C42]/20 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 w-full outline-none transition-all text-sm"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="bg-gray-50 border border-gray-200 focus:border-[#1B6C42] focus:ring-2 focus:ring-[#1B6C42]/20 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 w-full outline-none transition-all text-sm"
            />

            {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          </div>

          <button
            onClick={submit}
            disabled={isSubmitting || !email || !password || (!isSignInMode && !name)}
            className="mt-6 w-full bg-[#1B6C42] text-white py-3.5 rounded-xl font-medium text-sm hover:bg-[#155A35] shadow-sm transition-all duration-300 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : isSignInMode ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>

          <p className="text-center text-gray-500 text-xs mt-6">
            {isSignInMode ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => onModeChange(isSignInMode ? "signup" : "signin")}
              className="text-[#1B6C42] font-medium hover:underline cursor-pointer"
            >
              {isSignInMode ? "Get started" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

