import { Info } from "lucide-react";

/**
 * Avertissement non-médical OBLIGATOIRE sur tout écran C.O.R.E.
 * Les événements collectifs sont une pratique de présence et d'intention —
 * jamais un soin, jamais une promesse de résultat.
 */
export default function COREDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="glass rounded-2xl p-4 border-[var(--kaia-moon)]/20 flex items-start gap-3"
      role="note"
    >
      <Info className="w-4 h-4 text-[var(--kaia-moon)] shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
        {compact
          ? "Pratique de présence collective — ni soin, ni thérapie médicale."
          : "Les événements C.O.R.E. sont une pratique de présence, de respiration et d'intention partagée. Ce n'est ni un soin, ni une thérapie, ni une promesse de résultat. En cas de difficulté de santé, consulte un·e professionnel·le."}
      </p>
    </div>
  );
}
