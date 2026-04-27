import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RitualPlayer, type RitualSummary } from "@/components/rituals/RitualPlayer";
import { LiveCounter } from "@/components/rituals/LiveCounter";
import { getThemeLabelFr, type RitualTheme } from "@/lib/agent/prompts/ritual-host";

export const dynamic = "force-dynamic";

interface RitualI18nFr {
  intro_short?: string;
  intent_one_line?: string;
  guidance_steps?: string[];
  closing_phrase?: string;
  audio_script_fr?: string;
  breathing?: { pattern_label?: string; cycles?: number };
}

export default async function RitualSinglePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!/^\d{4}-W\d{2}$/.test(slug)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/rituals/${slug}`);

  const { data: ritualRow } = await supabase
    .from("weekly_rituals")
    .select("id, slug, theme, starts_at, ends_at, i18n, participants_count")
    .eq("slug", slug)
    .maybeSingle();
  if (!ritualRow) notFound();

  const { data: myParticipation } = await supabase
    .from("ritual_participations")
    .select("ritual_id")
    .eq("user_id", user.id)
    .eq("ritual_id", ritualRow.id)
    .maybeSingle();

  const i18n = (ritualRow.i18n ?? {}) as { fr?: RitualI18nFr & { title?: string } };
  const fr = i18n.fr ?? {};
  const themeLabel = fr.title ?? getThemeLabelFr(ritualRow.theme as RitualTheme);

  const ritual: RitualSummary = {
    id: ritualRow.id,
    slug: ritualRow.slug,
    themeLabel,
    intro: fr.intro_short ?? "",
    intent: fr.intent_one_line ?? "",
    steps: fr.guidance_steps ?? [],
    closingPhrase: fr.closing_phrase ?? "",
    audioScript: fr.audio_script_fr ?? "",
    breathingLabel: fr.breathing?.pattern_label ?? "4-4-6",
    breathingCycles: fr.breathing?.cycles ?? 3,
    alreadyJoined: !!myParticipation,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link
        href="/rituals"
        className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white wellness-anim"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Retour au rituel courant
      </Link>

      <header className="space-y-3">
        <h1 className="font-display text-3xl text-white tracking-tight">
          Rituel · {ritualRow.slug}
        </h1>
        <LiveCounter
          ritualId={ritualRow.id}
          initialCount={ritualRow.participants_count ?? 0}
        />
      </header>

      <RitualPlayer ritual={ritual} />
    </div>
  );
}
