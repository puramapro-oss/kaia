import { ImpactCounter } from "@/components/shared/ImpactCounter";
import type { ImpactCounters } from "@/lib/impact/aggregate";

interface PersonalTabProps {
  impact: ImpactCounters;
  tokensLifetimeEarned: number;
  practicesCount: number;
  routinesCount: number;
  totalMinutes: number;
}

export function PersonalTab({
  impact,
  tokensLifetimeEarned,
  practicesCount,
  routinesCount,
  totalMinutes,
}: PersonalTabProps) {
  const empty =
    practicesCount === 0 &&
    routinesCount === 0 &&
    impact.treesPlanted === 0 &&
    impact.peopleHelped === 0;

  return (
    <div className="space-y-6">
      <p className="text-white/65 max-w-2xl leading-relaxed">
        Chaque petite action laisse une trace. Voici la tienne — sobre, honnête, sans course.
      </p>

      {empty && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center space-y-2">
          <p className="font-display text-lg text-white/85">Tu commences à peine.</p>
          <p className="text-sm text-white/55">
            Une routine terminée, une mission validée — et ces compteurs prennent vie.
          </p>
        </div>
      )}

      <section aria-label="Mes pratiques" className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">Mes pratiques</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <ImpactCounter
            value={practicesCount}
            label="Pratiques"
            emoji="🌿"
            accent="var(--color-kaia-accent)"
          />
          <ImpactCounter
            value={routinesCount}
            label="Routines complètes"
            emoji="✨"
            accent="var(--color-kaia-gold)"
          />
          <ImpactCounter
            value={totalMinutes}
            label="Minutes pour toi"
            emoji="⏳"
            unit="min"
            accent="#F472B6"
          />
        </div>
      </section>

      <section aria-label="Mon empreinte" className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">Mon empreinte</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <ImpactCounter
            value={impact.treesPlanted}
            label="Arbres plantés"
            emoji="🌳"
            accent="#1A4D3A"
          />
          <ImpactCounter
            value={impact.peopleHelped}
            label="Personnes aidées"
            emoji="🤝"
            accent="#F4C430"
          />
          <ImpactCounter
            value={impact.wasteCollectedKg}
            label="Déchets collectés"
            emoji="♻️"
            unit="kg"
            decimals={1}
            accent="#06B6D4"
          />
          <ImpactCounter
            value={impact.waterSavedL}
            label="Eau économisée"
            emoji="💧"
            unit="L"
            decimals={0}
            accent="#06B6D4"
          />
          <ImpactCounter
            value={impact.eurosRedistributed}
            label="€ redistribués"
            emoji="💞"
            unit="€"
            decimals={2}
            accent="#D4906A"
          />
          <ImpactCounter
            value={tokensLifetimeEarned}
            label="Tokens gagnés (à vie)"
            emoji="⭐"
            accent="var(--color-kaia-accent)"
          />
        </div>
      </section>

      <p className="text-xs text-white/40 leading-relaxed max-w-2xl">
        Aucun classement vs autres. Aucune pression. Juste tes propres traces, qui s'additionnent
        avec celles de la communauté pour un total que tu vois dans l'onglet Collectif.
      </p>
    </div>
  );
}
