import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/Card";
import {
  DEFAULT_MULTISENSORIAL_PREFS,
  type MultisensorialPrefs,
} from "@/hooks/useMultisensorialPrefs";
import { MultisensorialToggleList } from "./MultisensorialToggleList";
import { BinauralPlayer } from "@/components/multisensorial/BinauralPlayer";
import { BreathingCircle } from "@/components/multisensorial/BreathingCircle";

export const metadata = { title: "Multisensoriel — Réglages" };

export default async function MultisensorialSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/settings/multisensorial");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "multisensorial_background_video, multisensorial_haptics, multisensorial_binaural, multisensorial_cinematic, accessibility_reduced_motion"
    )
    .eq("id", user.id)
    .maybeSingle();

  const prefs: MultisensorialPrefs = profile
    ? {
        background_video: profile.multisensorial_background_video ?? DEFAULT_MULTISENSORIAL_PREFS.background_video,
        haptics: profile.multisensorial_haptics ?? DEFAULT_MULTISENSORIAL_PREFS.haptics,
        binaural: profile.multisensorial_binaural ?? DEFAULT_MULTISENSORIAL_PREFS.binaural,
        cinematic: profile.multisensorial_cinematic ?? DEFAULT_MULTISENSORIAL_PREFS.cinematic,
        reduced_motion: profile.accessibility_reduced_motion ?? DEFAULT_MULTISENSORIAL_PREFS.reduced_motion,
      }
    : DEFAULT_MULTISENSORIAL_PREFS;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-sm text-white/55 hover:text-white wellness-anim"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.7} />
          Réglages
        </Link>
      </div>

      <header className="space-y-2">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          Multisensoriel
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Le calme à ta mesure.
        </h1>
        <p className="text-white/55 max-w-xl">
          Quatre couches sensorielles pour adoucir l'expérience. Chacune se désactive
          séparément. Aucun jugement, juste ton rythme.
        </p>
      </header>

      <MultisensorialToggleList initialPrefs={prefs} />

      <section aria-label="Aperçu des sons binauraux" className="space-y-4">
        <h2 className="font-display text-xl text-white tracking-tight">
          Sons binauraux — aperçu
        </h2>
        <BinauralPlayer />
      </section>

      <section aria-label="Aperçu de la respiration" className="space-y-4">
        <h2 className="font-display text-xl text-white tracking-tight">
          Respiration — aperçu
        </h2>
        <GlassCard className="flex justify-center py-8">
          <BreathingCircle defaultPattern="478" cycles={2} />
        </GlassCard>
      </section>
    </div>
  );
}
