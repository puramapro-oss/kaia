"use client";

import { useState, useRef, useEffect } from "react";
import { Send, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  flagged?: boolean;
}

export function AiHelpChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setPending(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/ai-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: j.error ?? "Erreur. Réessaye dans un instant." },
        ]);
        return;
      }
      setThreadId(j.threadId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: j.reply, flagged: Boolean(j.sosOpen) },
      ]);
      if (j.sosOpen) setSosOpen(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Erreur réseau. Réessaye dans un instant." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
      {sosOpen && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-rose-300/10 border-b border-rose-300/30 p-4 text-rose-100"
        >
          <AlertTriangle className="h-5 w-5 flex-none mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Tu n&apos;es pas seul·e</p>
            <p>
              Va sur la page{" "}
              <Link href="/sos" className="underline font-medium">
                /sos
              </Link>{" "}
              pour les ressources humaines (3114, 112, SOS Amitié). Disponibles 24h/24, gratuit, anonyme.
            </p>
          </div>
          <button
            onClick={() => setSosOpen(false)}
            className="text-xs text-rose-100/60 hover:text-rose-100"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-white/50 mt-12">
            Commence par une question. Exemples : « Comment marche le parrainage ? », « Pourquoi
            je gagne des tokens ? », « Une routine de 5 min pour le matin ? »
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                m.role === "user"
                  ? "bg-amber-300 text-black"
                  : m.flagged
                    ? "bg-rose-300/15 text-rose-100 border border-rose-300/30"
                    : "bg-white/[0.06] text-white/90"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] text-white/60 rounded-2xl px-4 py-2.5 text-sm">
              KAÏA réfléchit…
            </div>
          </div>
        )}
      </div>

      <form
        className="border-t border-white/[0.06] p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose ta question…"
          disabled={pending}
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm"
          aria-label="Question"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-xl bg-amber-300 text-black px-4 py-2.5 hover:bg-amber-200 disabled:opacity-60"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
