import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { askClaudeJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildRoutineGeneratorSystem,
  buildRoutineGeneratorUserMessage,
  type RoutineGenerateOutput,
} from "@/lib/agent/prompts/routine-generator";
import { detectMedicalClaims } from "@/lib/safety/medical-claims-blocklist";
import { ROUTINE_GOALS } from "@/lib/practices/categories";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  durationMinutes: z.number().int().min(1).max(30),
  goal: z.enum(ROUTINE_GOALS),
  pulse: z
    .object({
      stress: z.number().int().min(1).max(5),
      energy: z.number().int().min(1).max(5),
      mood: z.number().int().min(1).max(5),
    })
    .optional(),
  preferredCategories: z.array(z.string()).max(7).optional(),
  audioMode: z.enum(["silence", "nature", "binaural", "voice"]).optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

const OutputSchema = z.object({
  intro: z.string().min(1).max(400),
  practices: z
    .array(
      z.object({
        slug: z
          .string()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9-]+$/, "slug doit être en kebab-case"),
        title: z.string().min(2).max(80),
        category: z.enum([
          "meditation",
          "breathing",
          "mantra",
          "mudra",
          "movement",
          "learning",
          "reprogramming",
        ]),
        durationSeconds: z.number().int().min(30).max(900),
        why: z.string().min(2).max(280),
        steps: z.array(z.string().min(2).max(280)).min(2).max(8),
      }),
    )
    .min(1)
    .max(8),
  totalSeconds: z.number().int().min(30).max(2000),
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

  // 10 générations / heure / user — coût IA modéré.
  const rl = await rateLimit(`agent-routine:${user.id}`, 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Tu as atteint la limite horaire de générations. Reviens dans une heure." },
      { status: 429 },
    );
  }

  const locale = parsed.data.locale ?? "fr";
  const systemPrompt = buildRoutineGeneratorSystem(locale);
  const userMessage = buildRoutineGeneratorUserMessage(parsed.data);

  let output: RoutineGenerateOutput;
  try {
    output = await askClaudeJSON<RoutineGenerateOutput>(userMessage, {
      model: "main",
      maxTokens: 2048,
      systemPrompt,
      temperature: 0.7,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "IA indisponible.";
    return NextResponse.json(
      { error: "Génération impossible pour le moment, réessaie.", details: message },
      { status: 502 },
    );
  }

  // Validation Zod du JSON IA — l'IA peut halluciner des shapes invalides.
  const safe = OutputSchema.safeParse(output);
  if (!safe.success) {
    return NextResponse.json(
      { error: "Routine générée invalide, réessaie.", details: safe.error.issues },
      { status: 502 },
    );
  }

  // Filter sécurité médicale sur tout le texte généré.
  const allText = [
    safe.data.intro,
    ...safe.data.practices.flatMap((p) => [p.title, p.why, ...p.steps]),
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
