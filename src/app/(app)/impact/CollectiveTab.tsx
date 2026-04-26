import { ImpactCounter } from "@/components/shared/ImpactCounter";
import type { ImpactCounters } from "@/lib/impact/aggregate";

interface LeaderEntry {
  rank: number;
  fullName: string;
  trees: number;
  helped: number;
  euros: number;
}

interface CollectiveTabProps {
  global: ImpactCounters;
  routinesCompleted: number;
  activeUsers30d: number;
  leaderboard: LeaderEntry[];
}

export function CollectiveTab({
  global,
  routinesCompleted,
  activeUsers30d,
  leaderboard,
}: CollectiveTabProps) {
  const empty = activeUsers30d === 0 && routinesCompleted === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2 max-w-2xl">
        <p className="font-display text-2xl text-white/95 tracking-tight">
          La communauté KAÏA, ensemble.
        </p>
        <p className="text-white/65 leading-relaxed">
          Pas de course. Pas de meilleur·e. Juste un total qui grandit chaque jour, parce que des
          gens prennent 4 minutes pour eux — et pour le monde.
        </p>
      </div>

      {empty && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
          <p className="font-display text-lg text-white/85">La communauté commence.</p>
          <p className="text-sm text-white/55 mt-1">
            Les chiffres se mettent à jour automatiquement dès que des routines arrivent.
          </p>
        </div>
      )}

      <section aria-label="Activité collective" className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">Activité 30 jours</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <ImpactCounter
            value={activeUsers30d}
            label="Personnes actives"
            emoji="🌍"
            accent="var(--color-kaia-accent)"
          />
          <ImpactCounter
            value={routinesCompleted}
            label="Routines terminées"
            emoji="✨"
            accent="var(--color-kaia-gold)"
          />
          <ImpactCounter
            value={global.totalCo2AvoidedKg}
            label="CO₂ évité"
            emoji="🌱"
            unit="kg"
            decimals={0}
            accent="#1A4D3A"
          />
        </div>
      </section>

      <section aria-label="Empreinte collective" className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Notre empreinte
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <ImpactCounter
            value={global.treesPlanted}
            label="Arbres plantés"
            emoji="🌳"
            accent="#1A4D3A"
          />
          <ImpactCounter
            value={global.peopleHelped}
            label="Personnes aidées"
            emoji="🤝"
            accent="#F4C430"
          />
          <ImpactCounter
            value={global.wasteCollectedKg}
            label="Déchets collectés"
            emoji="♻️"
            unit="kg"
            decimals={0}
            accent="#06B6D4"
          />
          <ImpactCounter
            value={global.waterSavedL}
            label="Eau économisée"
            emoji="💧"
            unit="L"
            decimals={0}
            accent="#06B6D4"
          />
          <ImpactCounter
            value={global.eurosRedistributed}
            label="€ redistribués"
            emoji="💞"
            unit="€"
            decimals={0}
            accent="#D4906A"
          />
          <ImpactCounter
            value={global.totalCo2AvoidedKg}
            label="CO₂ évité"
            emoji="🌿"
            unit="kg"
            decimals={0}
            accent="#1A4D3A"
          />
        </div>
      </section>

      <section aria-label="Leaderboard d'impact" className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Leaderboard d'impact
        </h2>
        <p className="text-sm text-white/55 max-w-2xl">
          Pas de podium de performance. Juste une reconnaissance pour celles et ceux qui sèment le
          plus pour les autres.
        </p>
        {leaderboard.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/55">
            Aucune action collective enregistrée pour le moment.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {leaderboard.map((u) => (
              <li
                key={u.rank}
                className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 flex items-center gap-3"
              >
                <span className="font-display text-lg tabular-nums text-white/45 w-8">
                  {u.rank.toString().padStart(2, "0")}
                </span>
                <p className="flex-1 font-display text-base text-white/95 truncate">{u.fullName}</p>
                <p className="text-sm text-white/55 tabular-nums">
                  🌳 {u.trees} · 🤝 {u.helped} · {u.euros.toFixed(0)} €
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
