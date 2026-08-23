import { Check, Sparkles } from "lucide-react";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import { StepShell } from "./OnboardingComponents";

interface PaywallStepProps {
  onFinish: () => void;
  isPending: boolean;
  error: string | null;
}

export function PaywallStep({ onFinish, isPending, error }: PaywallStepProps) {
  return (
    <StepShell
      eyebrow="14 jours offerts"
      title="Tu as adoré ?"
      subtitle="Continue avec 14 jours gratuits, puis 14,99 € / mois — annulable à tout moment."
    >
      <ul className="space-y-2 text-white/70 text-sm">
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
          <span>Catalogue complet de 80+ pratiques</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
          <span>Routines IA personnalisées chaque jour</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
          <span>Tokens, rituels collectifs, contests</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 text-[var(--color-kaia-accent)] shrink-0" />
          <span>Aucune donnée santé stockée</span>
        </li>
      </ul>

      <div className="flex flex-col gap-2 pt-2">
        <HapticButton
          onClick={onFinish}
          variant="primary"
          size="lg"
          hapticIntensity="success"
          disabled={isPending}
          className="w-full"
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.7} />
          {isPending ? "Sauvegarde…" : "Démarrer mes 14 jours"}
        </HapticButton>
        <HapticButton
          onClick={onFinish}
          variant="ghost"
          size="md"
          hapticIntensity="selection"
          disabled={isPending}
          className="w-full"
        >
          Continuer pour le moment
        </HapticButton>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-kaia-terracotta)] mt-2" role="alert">
          {error}
        </p>
      )}
    </StepShell>
  );
}
