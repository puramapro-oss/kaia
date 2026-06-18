import { Sprout } from "lucide-react";
import { GRAINE_TO_EUR } from "@/lib/constants";

/**
 * Solde de Graines (1 Graine = 0,01€). Affichage présentationnel.
 * Mention légale MLC ESS 2014 obligatoire.
 */
export default function GrainesWallet({
  balance,
  totalEarned,
}: {
  balance: number;
  totalEarned: number;
}) {
  const euros = (balance * GRAINE_TO_EUR).toFixed(2);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sprout className="w-5 h-5 text-[var(--kaia-gold)]" />
        <h3 className="font-medium">Mon portefeuille de Graines</h3>
      </div>
      <div className="flex items-end gap-3 mb-2">
        <span className="font-display text-4xl font-semibold gradient-kaia-text">{balance}</span>
        <span className="text-sm text-[var(--foreground-muted)] mb-1">Graines · ≈ {euros}€</span>
      </div>
      <p className="text-xs text-[var(--foreground-muted)]">
        Total cumulé : {totalEarned} Graines
      </p>
      <p className="text-[10px] text-[var(--foreground-muted)] mt-4 leading-relaxed border-t border-[var(--kaia-moon)]/10 pt-3">
        Les Graines sont une monnaie locale complémentaire (MLC) au sens de la loi
        ESS du 31 juillet 2014. Elles n&apos;ont pas cours légal et leur conversion
        est soumise à vérification d&apos;identité.
      </p>
    </div>
  );
}
