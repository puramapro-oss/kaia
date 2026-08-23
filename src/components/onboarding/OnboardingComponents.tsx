import { ArrowRight } from "lucide-react";
import { HapticButton } from "@/components/multisensorial/HapticButton";
import { cn } from "@/lib/utils";

interface StepShellProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StepShell({ eyebrow, title, subtitle, children }: StepShellProps) {
  return (
    <div className="space-y-5">
      <div className="text-xs uppercase tracking-[0.2em] text-white/45">{eyebrow}</div>
      <h1 className="font-display text-3xl sm:text-4xl text-white/95 leading-tight">{title}</h1>
      {subtitle && <p className="text-white/55">{subtitle}</p>}
      <div className="space-y-4 pt-2">{children}</div>
    </div>
  );
}

export function NextButton({
  onClick,
  label = "Continuer",
  disabled,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <HapticButton
      onClick={onClick}
      variant="primary"
      size="md"
      hapticIntensity="selection"
      disabled={disabled}
      className="w-full sm:w-auto mt-2"
    >
      {label}
      <ArrowRight className="w-4 h-4 ml-1" strokeWidth={1.7} />
    </HapticButton>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-2xl border p-4 text-left wellness-anim flex items-center gap-3",
        checked ? "border-white/25 bg-white/[0.05]" : "border-white/10",
      )}
      aria-pressed={checked}
    >
      <div className="flex-1">
        <div className="font-display text-base text-white/95">{label}</div>
        <div className="text-sm text-white/55">{description}</div>
      </div>
      <div
        className={cn(
          "h-6 w-11 rounded-full p-0.5 wellness-anim",
          checked ? "bg-[var(--color-kaia-accent)]" : "bg-white/15",
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full bg-white wellness-anim",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
    </button>
  );
}
