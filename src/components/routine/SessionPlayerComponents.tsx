import { cn } from "@/lib/utils";

export function PulseCircle({ accent, running }: { accent: string; running: boolean }) {
  return (
    <div className="relative h-56 w-56 mx-auto grid place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(closest-side, ${accent}26 0%, transparent 70%)` }}
      />
      <div
        className={cn(
          "h-32 w-32 rounded-full transition-transform duration-[3500ms] ease-[cubic-bezier(0.45,0,0.55,1)]",
          running ? "scale-100" : "scale-90",
        )}
        style={{
          background: `radial-gradient(closest-side, ${accent}AA 0%, ${accent}33 60%, transparent 100%)`,
          boxShadow: `0 0 60px ${accent}55`,
        }}
        aria-hidden
      />
    </div>
  );
}

interface PostPulseProps {
  values: { stress: number | null; energy: number | null; mood: number | null };
  onChange: (next: { stress: number | null; energy: number | null; mood: number | null }) => void;
  disabled?: boolean;
}

export function PostPulse({ values, onChange, disabled }: PostPulseProps) {
  const rows: Array<{
    key: "stress" | "energy" | "mood";
    label: string;
    options: Array<{ value: number; emoji: string; label: string }>;
  }> = [
    {
      key: "stress",
      label: "Stress",
      options: [
        { value: 1, emoji: "🌱", label: "Très calme" },
        { value: 2, emoji: "🌿", label: "Calme" },
        { value: 3, emoji: "🌾", label: "Neutre" },
        { value: 4, emoji: "🍃", label: "Tendu" },
        { value: 5, emoji: "🌪️", label: "Agité" },
      ],
    },
    {
      key: "energy",
      label: "Énergie",
      options: [
        { value: 1, emoji: "🌙", label: "Vide" },
        { value: 2, emoji: "☁️", label: "Faible" },
        { value: 3, emoji: "⛅", label: "Moyen" },
        { value: 4, emoji: "☀️", label: "Bonne" },
        { value: 5, emoji: "✨", label: "Pleine" },
      ],
    },
    {
      key: "mood",
      label: "Humeur",
      options: [
        { value: 1, emoji: "🩶", label: "Difficile" },
        { value: 2, emoji: "🤍", label: "Sombre" },
        { value: 3, emoji: "💛", label: "Posé" },
        { value: 4, emoji: "💚", label: "Bien" },
        { value: 5, emoji: "💖", label: "Lumineux" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.key} className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45 text-left">
            {row.label}
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {row.options.map((opt) => {
              const active = values[row.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...values, [row.key]: opt.value })}
                  aria-pressed={active}
                  aria-label={`${row.label} : ${opt.label}`}
                  className={cn(
                    "h-12 rounded-2xl border wellness-anim flex items-center justify-center",
                    active
                      ? "border-[var(--color-kaia-accent)] bg-[var(--color-kaia-accent)]/10 scale-[1.05]"
                      : "border-white/10 hover:border-white/25",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {opt.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
