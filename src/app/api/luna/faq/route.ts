import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLunaModeConfig } from "@/lib/luna/modes";
import { passLocalFilter, detectCrisis, getCrisisResponse } from "@/lib/luna/safety";
import { smarana } from '@purama/smarana';

const schema = z.object({
  question: z.string().min(1).max(500),
});

const FAQ_CONFIG = getLunaModeConfig("faq");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rate limit: 20 req / 5 min
    const { count } = await supabase
      .from("luna_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 20) {
      return NextResponse.json(
        { error: "Trop de requêtes. Attends quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    await supabase.from("luna_rate_limit").insert({ user_id: user.id });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }

    const { question } = parsed.data;

    if (detectCrisis(question)) {
      return NextResponse.json({ answer: getCrisisResponse() });
    }

    const result = await smarana.ask({
      appSlug: 'kaia',
      userId: user.id,
      system: FAQ_CONFIG.systemPrompt,
      message: question,
      tier: FAQ_CONFIG.model,
      maxTokens: FAQ_CONFIG.maxTokens,
    });

    const answer = result.text;

    if (!passLocalFilter(answer)) {
      return NextResponse.json({
        answer:
          "Je ne suis pas en mesure de répondre à cette question. Consulte un professionnel de santé pour tout conseil médical.",
      });
    }

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json(
      { error: "Impossible de répondre. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
