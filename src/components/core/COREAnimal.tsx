import { PawPrint } from "lucide-react";

/**
 * Focus Animal — affiché quand un événement C.O.R.E. inclut nos compagnons
 * (présence apaisée partagée avec un animal). Décoratif, non-médical.
 */
export default function COREAnimal() {
  return (
    <div className="glass rounded-2xl p-5 border-[var(--kaia-gold)]/20">
      <div className="flex items-center gap-3 mb-2">
        <PawPrint className="w-5 h-5 text-[var(--kaia-gold)]" />
        <h3 className="font-medium">Focus Animal 🐾</h3>
      </div>
      <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
        Cet événement inclut la présence de ton animal. Installe-le près de toi,
        respire à son rythme, et laisse le calme circuler entre vous.
      </p>
    </div>
  );
}
