import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLunaModeConfig } from "@/lib/luna/modes";
import { passLocalFilter, detectCrisis, getCrisisResponse } from "@/lib/luna/safety";
import Anthropic from "@anthropic-ai/sdk";

const schema = z.object({
  question: z.string().min(1).max(500),
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FAQ_CONFIG = getLunaModeConfig("faq");
const FAQ_MODEL =
  FAQ_CONFIG.model === "fast"
    ? process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001"
    : process.env.ANTHROPIC_MODEL_MAIN ?? "claude-sonnet-4-6";

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

    const response = await anthropic.messages.create({
      model: FAQ_MODEL,
      max_tokens: FAQ_CONFIG.maxTokens,
      system: FAQ_CONFIG.systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("unexpected_response");
    }

    const answer = content.text;

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
