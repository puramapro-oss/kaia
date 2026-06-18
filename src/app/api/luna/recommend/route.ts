import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectPhase, getCycleDay } from "@/lib/cycle/phases";
import { getLunarPhase } from "@/lib/cycle/lunar";
import { passLocalFilter } from "@/lib/luna/safety";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("cycle_start_date, cycle_duration")
      .eq("id", user.id)
      .single();

    let phase = null;
    let dayInCycle = 0;
    let lunarPhase = null;

    if (profile?.cycle_start_date) {
      const startDate = new Date(profile.cycle_start_date);
      const cycleDuration = profile.cycle_duration || 28;
      dayInCycle = getCycleDay(startDate);
      phase = detectPhase(dayInCycle, cycleDuration);
      lunarPhase = getLunarPhase();
    }

    // Build context
    const context = phase
      ? `Phase du cycle: ${phase.label} (jour ${phase.dayInPhase}). Énergie: ${phase.energy}. Lune: ${lunarPhase?.label}.`
      : "Pas de données de cycle disponibles.";

    // Call Claude for recommendation
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const systemPrompt = `Tu es LUNA, l'intelligence de KAÏA.
Mode : Recommandation quotidienne personnalisée.
Génère 1 recommandation principale pour la journée basée sur le contexte du cycle et de la lune.
Structure : [Intention du jour] + [1 pratique concrète (5-15 min)] + [1 conseil nutrition ou mouvement]
Ton : motivant mais doux, ancré dans le corps féminin. Jamais culpabilisant.
JAMAIS de diagnostic médical ou de prescription.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Contexte : ${context}\n\nGénère une recommandation pour aujourd'hui.`,
        },
      ],
    });

    const recommendation = message.content[0].type === "text" ? message.content[0].text : "";

    // Local filter
    if (!passLocalFilter(recommendation)) {
      return NextResponse.json({
        recommendation:
          "Écoute ton corps aujourd'hui. Donne-toi la permission d'aller à ton rythme. 🌙",
        phase: phase?.label || null,
      });
    }

    return NextResponse.json({
      recommendation,
      phase: phase?.label || null,
    });
  } catch (err) {
    console.error("LUNA recommend error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
