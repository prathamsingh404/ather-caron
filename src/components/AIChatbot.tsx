"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, Sparkles, User, X } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "How do I cut my energy emissions this week?",
  "What is my biggest carbon source right now?",
  "Give me a transport optimization plan.",
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I’m Carbon AI. Ask about your latest emissions, reduction ideas, or where to focus next.",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (value?: string) => {
    const userInput = (value ?? inputVal).trim();
    if (!userInput || isLoading) return;

    setError(null);
    setInputVal("");
    const nextMessages = [...messages, { role: "user" as const, content: userInput }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Chat failed");
      }

      setMessages((current) => [...current, { role: "assistant", content: payload.response }]);
      if (payload.source === "fallback") {
        setError("Live AI was unavailable for that response, so a local fallback answer was used.");
      }
    } catch (err) {
      console.error(err);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I couldn’t reach the AI service just now. Try again in a moment or ask a shorter question.",
        },
      ]);
      setError("The AI chat route failed to respond successfully.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.35)] transition hover:-translate-y-1"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="glass-panel fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[32px] border border-white/50 dark:border-white/10"
          >
            <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-300">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Carbon AI</p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Context-aware assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-white/10 p-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-white/70 p-5 dark:bg-slate-950/35">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${message.role === "user" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-emerald-500 text-slate-950"}`}>
                      {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                  <Sparkles className="h-4 w-4 animate-pulse text-emerald-500" />
                  Carbon AI is preparing a response...
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className="border-t border-white/40 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/45">
              {error && <div className="mb-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-700 dark:text-amber-300">{error}</div>}

              <div className="mb-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  value={inputVal}
                  onChange={(event) => setInputVal(event.target.value)}
                  placeholder="Ask about your emissions..."
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isLoading}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
