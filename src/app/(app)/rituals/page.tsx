import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RitualPlayer, type RitualSummary } from "@/components/rituals/RitualPlayer";
import { LiveCounter } from "@/components/rituals/LiveCounter";
import { isoWeekSlug } from "@/lib/rituals/theme-rotation";
import { getThemeLabelFr, type RitualTheme } from "@/lib/agent/prompts/ritual-host";

export const metadata = {
  title: "Rituel hebdomadaire — KAÏA",
  description: "Rejoignez le rituel collectif de la semaine.",
};

export const dynamic = "force-dynamic";

interface RitualI18nFr {
  intro_short?: string;
  intent_one_line?: string;
  guidance_steps?: string[];
  closing_phrase?: string;
  audio_script_fr?: string;
  breathing?: { pattern_label?: string; cycles?: number };
}

export default async function RitualsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rituals");

  const slug = isoWeekSlug(new Date());

  // Cherche d'abord le rituel de la semaine en cours
  const { data: current } = await supabase
    .from("weekly_rituals")
    .select("id, slug, theme, starts_at, ends_at, i18n, participants_count")
    .eq("slug", slug)
    .maybeSingle();

  // Mes participations
  const { data: myParticipation } = await supabase
    .from("ritual_participations")
    .select("ritual_id")
    .eq("user_id", user.id);
  const myRitualIds = new Set((myParticipation ?? []).map((p) => p.ritual_id));

  if (!current) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <header className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-gold)]">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            Rituel collectif
          </span>
          <h1 className="font-display text-3xl text-white tracking-tight">
            Le rituel de la semaine arrive bientôt
          </h1>
          <p className="text-sm text-white/55 leading-relaxed">
            Le rituel collectif est généré chaque lundi à 6h (UTC). Reviens dans quelques heures.
          </p>
        </header>
      </div>
    );
  }

  const i18n = (current.i18n ?? {}) as { fr?: RitualI18nFr & { title?: string } };
  const fr = i18n.fr ?? {};
  const themeLabel = fr.title ?? getThemeLabelFr(current.theme as RitualTheme);

  const ritual: RitualSummary = {
    id: current.id,
    slug: current.slug,
    themeLabel,
    intro: fr.intro_short ?? "Bienvenue dans ce moment partagé.",
    intent: fr.intent_one_line ?? "",
    steps: fr.guidance_steps ?? [],
    closingPhrase: fr.closing_phrase ?? "",
    audioScript: fr.audio_script_fr ?? "",
    breathingLabel: fr.breathing?.pattern_label ?? "4-4-6",
    breathingCycles: fr.breathing?.cycles ?? 3,
    alreadyJoined: myRitualIds.has(current.id),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl text-white tracking-tight">
          Rituel de la semaine
        </h1>
        <LiveCounter ritualId={current.id} initialCount={current.participants_count ?? 0} />
      </header>

      <RitualPlayer ritual={ritual} />

      <p className="text-[12px] text-white/35 text-center">
        Semaine ISO {current.slug} · valable jusqu'à dimanche soir
      </p>
    </div>
  );
}
