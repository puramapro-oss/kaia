export const dynamic = "force-dynamic";

const FLAGS = [
  {
    key: "ENABLE_WHISPER",
    label: "Onboarding vocal Whisper",
    note: "Activer P3+ quand OPENAI_API_KEY fourni.",
  },
  {
    key: "ENABLE_ELEVENLABS",
    label: "TTS multilingue ElevenLabs",
    note: "Activer P9 quand ELEVENLABS_API_KEY fourni.",
  },
  {
    key: "ENABLE_CASH_REDISTRIBUTION",
    label: "Redistribution cash Treezor",
    note: "Phase 2 EME ACPR — désactivé Phase 1.",
  },
  {
    key: "ENABLE_REPLICATE_VIDEO",
    label: "Génération vidéos nature Replicate",
    note: "Coût ~1.44€ pour 12 clips. Désactivé par défaut.",
  },
];

export default function AdminFlagsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Feature flags</h1>
      <p className="text-sm text-white/70 mb-6">
        Les flags sont contrôlés par les variables d&apos;environnement Vercel. Modification :{" "}
        <code className="text-xs font-mono">vercel env add &lt;FLAG&gt; production</code>.
      </p>
      <div className="space-y-3">
        {FLAGS.map((f) => {
          const value = process.env[f.key];
          const enabled = value === "true" || value === "1";
          return (
            <div
              key={f.key}
              className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <code className="text-xs font-mono text-amber-300">{f.key}</code>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      enabled
                        ? "bg-emerald-300/15 text-emerald-200"
                        : "bg-white/[0.06] text-white/60"
                    }`}
                  >
                    {enabled ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="font-medium">{f.label}</p>
                <p className="text-xs text-white/60 mt-1">{f.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
