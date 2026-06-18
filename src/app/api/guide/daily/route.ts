import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askClaude } from "@/lib/claude";
import { getLunaModeConfig } from "@/lib/luna/modes";
import { passLocalFilter } from "@/lib/luna/safety";
import { rateLimit } from "@/lib/rate-limit";
import { getLifeGuide } from "@/lib/cycle/life-guide";
import { getPhaseFromProfile } from "@/lib/cycle/phases";

export const dynamic = "force-dynamic";

/** Guide de vie du jour : socle statique (life-guide) + enrichissement LUNA optionnel. */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Profil (phase) + rate limit en parallèle : opérations indépendantes.
    const [{ data: profile }, limit] = await Promise.all([
      supabase
        .from("profiles")
        .select("cycle_start_date, cycle_duration, full_name")
        .eq("id", user.id)
        .single(),
      rateLimit(`guide-daily:${user.id}`, 20, 5 * 60),
    ]);

    const phase = getPhaseFromProfile(profile);
    const guide = getLifeGuide(phase);

    // Pas de clé IA ou quota atteint → socle statique seul (jamais d'écran vide).
    if (!process.env.ANTHROPIC_API_KEY || !limit.allowed) {
      return NextResponse.json({ phase, guide, lunaMessage: null });
    }

    // Journal des 7 derniers jours (sans notes chiffrées) pour contextualiser.
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: journal } = await supabase
      .from("cycle_journal")
      .select("date, mood, energy, symptoms")
      .eq("user_id", user.id)
      .gte("date", since)
      .order("date", { ascending: false })
      .limit(7);

    const journalSummary =
      journal && journal.length
        ? journal
            .map((j) => `${j.date}: humeur ${j.mood}/5, énergie ${j.energy}/5${j.symptoms?.length ? `, ${j.symptoms.join("/")}` : ""}`)
            .join(" | ")
        : "Aucune note récente.";

    const config = getLunaModeConfig("daily_recommendation");
    const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "elle";
    const prompt = `Phase actuelle : ${guide.title} (${phase}). Mantra : "${guide.mantra}".
Journal des 7 derniers jours : ${journalSummary}
Prénom : ${firstName}.
Génère le guide du jour personnalisé (intention + 1 pratique + 1 conseil), 4 phrases max, ton doux.`;

    let lunaMessage: string | null = null;
    try {
      const raw = (await askClaude(prompt, {
        model: config.model,
        maxTokens: config.maxTokens,
        systemPrompt: config.systemPrompt,
      })).trim();
      lunaMessage = passLocalFilter(raw) ? raw : null;
    } catch (err) {
      console.error("Guide daily LUNA error:", err);
      // Fallback gracieux : on renvoie le socle statique sans message LUNA.
      lunaMessage = null;
    }

    return NextResponse.json({ phase, guide, lunaMessage });
  } catch (err) {
    console.error("Guide daily error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
