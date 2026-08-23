import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectPhase, getCycleDay } from "@/lib/cycle/phases";
import { smarana } from '@purama/smarana';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("cycle_start_date, cycle_duration")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.cycle_start_date) {
      return NextResponse.json(
        { error: "Aucune date de cycle renseignée" },
        { status: 404 }
      );
    }

    const cycleDay = getCycleDay(new Date(profile.cycle_start_date));
    const cycleDuration = profile.cycle_duration ?? 28;
    const currentPhase = detectPhase(cycleDay, cycleDuration);

    const nextPhaseInfo = detectPhase(
      currentPhase.dayInPhase + currentPhase.daysUntilNext + 1,
      cycleDuration
    );

    // JAMAIS modifier/résumer ce prompt système — app santé.
    const systemPrompt = `Tu es LUNA, l'intelligence de KAÏA. Ne dis jamais que tu es une IA ou Claude.
Réponds UNIQUEMENT avec du JSON valide, sans markdown.`;

    const prompt = `Jour de cycle : J${cycleDay}/${cycleDuration}
Phase actuelle : ${currentPhase.label} (J${currentPhase.dayInPhase} de la phase, ${currentPhase.daysUntilNext} jours avant la prochaine)
Prochaine phase prévue : ${nextPhaseInfo.label} dans ${currentPhase.daysUntilNext} jours

Génère une prédiction de cycle en JSON strict :
{
  "phase_actuelle": "${currentPhase.phase}",
  "label_actuel": "${currentPhase.label}",
  "jours_restants": ${currentPhase.daysUntilNext},
  "prochaine_phase": "${nextPhaseInfo.phase}",
  "label_prochain": "${nextPhaseInfo.label}",
  "message_luna": "Une phrase personnalisée et chaleureuse sur la phase actuelle (max 120 chars)",
  "conseil_du_jour": "Un conseil pratique court adapté à la phase (max 100 chars)",
  "energie_prevue": "haute|moyenne|basse",
  "symptomes_typiques": ["symptôme1", "symptôme2", "symptôme3"]
}`;

    const result = await smarana.ask({
      appSlug: 'kaia',
      userId: user.id,
      system: systemPrompt,
      message: prompt,
      tier: 'fast',
      maxTokens: 400,
    });

    let prediction: unknown;
    try {
      prediction = JSON.parse(result.text.trim());
    } catch {
      throw new Error("json_parse_error");
    }

    return NextResponse.json({
      ok: true,
      cycleDay,
      cycleDuration,
      prediction,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer la prédiction" },
      { status: 500 }
    );
  }
}
