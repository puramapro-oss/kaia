import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPhaseFromProfile } from "@/lib/cycle/phases";
import PhaseGuide from "@/components/guide/PhaseGuide";
import EmotionGuide from "@/components/cycle/EmotionGuide";
import BackButton from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: "Guide de Vie Cyclique — KAÏA",
  description: "Ton quotidien adapté à chaque phase de ton cycle : énergie, focus, mouvement, alimentation.",
};

export default async function GuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cycle_start_date, cycle_duration")
    .eq("id", user.id)
    .single();

  const currentPhase = getPhaseFromProfile(profile);

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <BackButton href="/cycle" />
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">Guide de Vie Cyclique</h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Vivre chaque jour en accord avec ta phase. Pédagogique, jamais médical.
        </p>
      </div>
      <PhaseGuide currentPhase={currentPhase} />

      <div className="mt-10">
        <EmotionGuide currentPhase={currentPhase} />
      </div>
    </div>
  );
}
