"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ARProtocols from "@/components/ar/ARProtocols";
import type { ARProtocol, ARTargetType } from "@/lib/ar/protocols";
import { AR_STYLES, type ARStyle } from "@/lib/ar/consent";

const TARGETS: { value: ARTargetType; label: string; emoji: string }[] = [
  { value: "soi", label: "Soi", emoji: "🪞" },
  { value: "personne", label: "Une proche", emoji: "🤝" },
  { value: "animal", label: "Un animal", emoji: "🐾" },
  { value: "collectif", label: "Collectif", emoji: "⭕" },
];

const STYLE_KEYS = Object.keys(AR_STYLES) as ARStyle[];

export default function ARLandingClient({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [target, setTarget] = useState<ARTargetType>("soi");
  const [protocol, setProtocol] = useState<ARProtocol | null>(null);

  function chooseStyle(style: "A" | "B") {
    if (!protocol) return;
    router.push(`/ar/${style}?protocol=${protocol.slug}&target=${target}`);
  }

  const available = protocol?.targetTypes.includes(target) ?? false;

  return (
    <div className="space-y-6">
      {!enabled && (
        <div className="glass rounded-2xl p-4 border-[var(--kaia-gold)]/20">
          <p className="text-sm text-[var(--kaia-gold)]">
            Le Miroir Énergétique arrive bientôt. Explore les protocoles en attendant ✨
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium mb-2">Pour qui ?</h2>
        <div className="flex gap-2">
          {TARGETS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTarget(t.value)}
              className={[
                "flex-1 py-3 rounded-xl text-xs font-medium transition-colors",
                target === t.value
                  ? "bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
                  : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)]",
              ].join(" ")}
            >
              <span className="block text-lg mb-0.5">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-2">Choisis un protocole</h2>
        <ARProtocols selected={protocol?.slug} onSelect={setProtocol} />
      </div>

      {protocol && !available && (
        <p className="text-xs text-[var(--foreground-muted)]">
          Ce protocole n&apos;est pas disponible pour cette cible. Choisis-en un autre.
        </p>
      )}

      {protocol && available && (
        <div>
          <h2 className="text-sm font-medium mb-2">Style du miroir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STYLE_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => chooseStyle(key)}
                disabled={!enabled}
                className="glass rounded-2xl p-5 text-left hover:bg-[var(--kaia-moon)]/10 transition-colors disabled:opacity-50"
              >
                <h3 className="font-medium mb-1">{AR_STYLES[key].title}</h3>
                <p className="text-xs text-[var(--foreground-muted)]">{AR_STYLES[key].desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
