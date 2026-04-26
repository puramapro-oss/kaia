import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { askClaudeJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { getSystemPrompt } from "@/lib/agent/prompts/system-kaia";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 15;

const Body = z.object({
  text: z.string().min(1).max(1000),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

const INTENTS = [
  "wants_routine",
  "wants_breathing",
  "wants_meditation",
  "wants_help_understanding_app",
  "wants_help_with_referral",
  "wants_help_with_subscription",
  "wants_help_with_tokens",
  "expresses_distress",
  "out_of_scope_medical",
  "out_of_scope_political",
  "off_topic",
  "unknown",
] as const;

interface IntentOutput {
  intent: (typeof INTENTS)[number];
  confidence: number;
  needs_sos: boolean;
  reason: string;
}

const OutputSchema = z.object({
  intent: z.enum(INTENTS),
  confidence: z.number().min(0).max(1),
  needs_sos: z.boolean(),
  reason: z.string().max(280),
});

const SHAPE = `{
  "intent": "wants_routine | wants_breathing | wants_meditation | wants_help_understanding_app | wants_help_with_referral | wants_help_with_subscription | wants_help_with_tokens | expresses_distress | out_of_scope_medical | out_of_scope_political | off_topic | unknown",
  "confidence": number (0..1),
  "needs_sos": boolean (true seulement si détresse sévère / idées noires / urgence),
  "reason": "string (1 phrase courte expliquant le classement)"
}`;

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const rl = await rateLimit(`agent-intent:${user.id}`, 60, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const locale = parsed.data.locale ?? "fr";
  const system = `${getSystemPrompt(locale)}

## TÂCHE — Classification d'intention
On te donne un message utilisateur. Tu réponds en JSON strict avec l'intention détectée et un drapeau \`needs_sos\` si tu détectes un signal de détresse sévère (idées noires, urgence, mots explicites du type "je veux mourir", "je n'en peux plus", etc.).

Shape :
${SHAPE}`;

  let output: IntentOutput;
  try {
    output = await askClaudeJSON<IntentOutput>(parsed.data.text, {
      model: "fast",
      maxTokens: 256,
      systemPrompt: system,
      temperature: 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "IA indisponible.";
    return NextResponse.json(
      { error: "Classification impossible, réessaie.", details: message },
      { status: 502 },
    );
  }

  const safe = OutputSchema.safeParse(output);
  if (!safe.success) {
    return NextResponse.json(
      { error: "Réponse IA invalide.", details: safe.error.issues },
      { status: 502 },
    );
  }
  return NextResponse.json(safe.data);
}
