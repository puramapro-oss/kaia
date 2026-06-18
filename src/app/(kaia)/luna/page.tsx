"use client";

import { useState } from "react";
import { LunaMode } from "@/lib/luna/modes";
import LunaChatInterface from "@/components/luna/LunaChatInterface";

const MODES: Array<{ key: LunaMode; label: string; emoji: string }> = [
  { key: "cycle_analysis", label: "Cycle", emoji: "🌑" },
  { key: "daily_recommendation", label: "Bien-être", emoji: "✨" },
  { key: "aurora_guidance", label: "AURORA", emoji: "🌬️" },
  { key: "faq", label: "FAQ", emoji: "❓" },
  { key: "caregiver_support", label: "Aidant·e", emoji: "💜" },
  { key: "general", label: "Général", emoji: "🌙" },
];

export default function LunaPage() {
  const [selectedMode, setSelectedMode] = useState<LunaMode>("general");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Mode selector */}
      <div className="border-b border-white/10 px-5 py-4">
        <h1 className="font-cormorant text-2xl font-semibold text-kaia-moon mb-4">LUNA</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setSelectedMode(mode.key)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-all flex items-center gap-2
                ${
                  selectedMode === mode.key
                    ? "bg-gradient-to-r from-kaia-moon to-kaia-gold text-kaia-primary"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }
              `}
            >
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <LunaChatInterface mode={selectedMode} />
      </div>
    </div>
  );
}
