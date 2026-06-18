"use client";

import { useState, useRef, useEffect } from "react";
import { LunaMode } from "@/lib/luna/modes";
import LunaAvatar from "./LunaAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LunaChatInterfaceProps {
  mode?: LunaMode;
}

export default function LunaChatInterface({ mode = "general" }: LunaChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lunaState, setLunaState] = useState<"idle" | "listening" | "speaking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLunaState("listening");

    try {
      const res = await fetch("/api/luna/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          mode,
          history: messages,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la réponse de LUNA");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Pas de stream disponible");

      setLunaState("speaking");
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: assistantMessage }];
                  }
                  return [...prev, { role: "assistant", content: assistantMessage }];
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      setLunaState("idle");
    } catch (err) {
      console.error("LUNA chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolée, je rencontre une difficulté technique. Peux-tu réessayer ?",
        },
      ]);
      setLunaState("idle");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Disclaimer bar */}
      <div className="bg-kaia-rose/10 border-b border-kaia-rose/20 px-4 py-2 text-xs text-white/70 text-center">
        LUNA n'est pas un médecin. Informations non médicales. En cas de crise: <strong>3114</strong>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center space-y-4 py-12">
            <LunaAvatar state="idle" />
            <div className="space-y-2">
              <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
                Bonjour, je suis LUNA
              </h3>
              <p className="text-white/60 text-sm max-w-md mx-auto">
                Je suis là pour t'accompagner avec douceur et bienveillance. Comment puis-je t'aider aujourd'hui ?
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-10 h-10">
                <LunaAvatar state={idx === messages.length - 1 && isLoading ? lunaState : "idle"} />
              </div>
            )}

            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-kaia-moon to-kaia-gold text-kaia-primary"
                  : "bg-white/5 border border-white/10 text-white/90"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.role === "user" && <div className="flex-shrink-0 w-10" />}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10">
              <LunaAvatar state="speaking" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-kaia-moon/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-kaia-moon/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-kaia-moon/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Écris ton message à LUNA..."
            rows={1}
            className="
              flex-1 px-4 py-3 rounded-xl resize-none
              bg-white/5 border border-white/10
              text-white placeholder:text-white/40
              focus:outline-none focus:ring-2 focus:ring-kaia-moon/50
              transition-all max-h-32
            "
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="
              px-6 py-3 rounded-xl font-medium
              bg-gradient-to-r from-kaia-moon to-kaia-gold
              text-kaia-primary
              hover:shadow-[0_0_20px_rgba(200,185,240,0.3)]
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              flex-shrink-0
            "
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
