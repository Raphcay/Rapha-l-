"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mark } from "./Mark";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content:
    "Bonjour, je suis l'assistant Arc. Pose-moi une question sur les matières, les tailles, une précommande ou la marque.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(1) }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch {
      setError("Connexion impossible. Réessaie dans un instant.");
    } finally {
      setIsLoading(false);
    }
  }

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: shouldReduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: shouldReduceMotion ? 1 : 0.98 }}
            transition={panelTransition}
            className="mb-3 flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col border border-line bg-surface-raised shadow-xl sm:w-96"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <Mark className="h-4 w-4 text-ink" />
              <div>
                <p className="font-display text-sm italic leading-none">Arc — Assistant</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Répond en quelques secondes
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-ink text-bg"
                      : "border border-line bg-bg text-ink"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="max-w-[85%] border border-line bg-bg px-3 py-2 text-sm text-muted">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
                  </span>
                </div>
              )}
              {error && (
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">
                  {error}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Écris ton message…"
                maxLength={1000}
                className="flex-1 border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
              >
                Envoyer
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        className="flex h-14 w-14 items-center justify-center border border-ink bg-surface-raised text-ink shadow-lg transition-colors hover:border-accent hover:text-accent"
      >
        {open ? (
          <span className="font-mono text-lg leading-none">×</span>
        ) : (
          <Mark className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
