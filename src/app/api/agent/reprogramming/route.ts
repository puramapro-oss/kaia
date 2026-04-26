import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { askClaudeJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildReprogrammingSystem,
  buildReprogrammingUserMessage,
  type ReprogrammingOutput,
} from "@/lib/agent/prompts/reprogramming";
import { detectMedicalClaims } from "@/lib/safety/medical-claims-blocklist";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  goal: z.string().min(2).max(160),
  situation: z.string().max(400).optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

const OutputSchema = z.object({
  affirmations: z.array(z.string().min(2).max(180)).min(5).max(7),
  visualization: z.string().min(60).max(800),
  closingPhrase: z.string().min(2).max(160),
});

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

  const rl = await rateLimit(`agent-reprog:${user.id}`, 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Limite horaire atteinte, reviens un peu plus tard." },
      { status: 429 },
    );
  }

  const locale = parsed.data.locale ?? "fr";
  const system = buildReprogrammingSystem(locale);
  const userMessage = buildReprogrammingUserMessage(parsed.data);

  let output: ReprogrammingOutput;
  try {
    output = await askClaudeJSON<ReprogrammingOutput>(userMessage, {
      model: "main",
      maxTokens: 1024,
      systemPrompt: system,
      temperature: 0.7,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "IA indisponible.";
    return NextResponse.json(
      { error: "Génération impossible, réessaie.", details: message },
      { status: 502 },
    );
  }

  const safe = OutputSchema.safeParse(output);
  if (!safe.success) {
    return NextResponse.json(
      { error: "Sortie IA invalide.", details: safe.error.issues },
      { status: 502 },
    );
  }

  const allText = [
    ...safe.data.affirmations,
    safe.data.visualization,
    safe.data.closingPhrase,
  ].join("\n");
  const violations = detectMedicalClaims(allText);
  if (violations.length > 0) {
    return NextResponse.json(
      {
        error: "Contenu non conforme détecté, on relance.",
        violations: violations.map((v) => v.matched),
      },
      { status: 422 },
    );
  }

  return NextResponse.json(safe.data);
}
