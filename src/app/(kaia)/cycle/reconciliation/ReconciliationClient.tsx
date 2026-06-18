"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";
import { RECONCILIATION_MODULES, type ReconciliationModuleKey } from "@/lib/cycle/reconciliation";

export default function ReconciliationClient() {
  const [openKey, setOpenKey] = useState<ReconciliationModuleKey | null>(null);

  return (
    <div className="space-y-3">
      {RECONCILIATION_MODULES.map((m) => {
        const open = openKey === m.key;
        return (
          <div key={m.key} className="glass rounded-2xl p-5">
            <button
              onClick={() => setOpenKey(open ? null : m.key)}
              aria-expanded={open}
              className="w-full text-left flex items-center gap-3"
            >
              <span className="text-2xl">{m.emoji}</span>
              <h2 className="font-medium">{m.title}</h2>
              <span className="ml-auto text-[var(--foreground-muted)]">{open ? "−" : "+"}</span>
            </button>

            {open && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">{m.intro}</p>
                <ul className="space-y-2">
                  {m.prompts.map((q, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-[var(--kaia-moon)] mt-0.5">·</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/luna"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)] hover:bg-[var(--kaia-moon)]/30 transition-colors"
                >
                  <MessageCircleHeart className="w-4 h-4" />
                  En parler avec LUNA
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
