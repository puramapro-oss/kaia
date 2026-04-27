/**
 * CRON `/api/cron/weekly-ritual` — génère le rituel collectif de la semaine ISO courante.
 * Schedule (vercel.json) : `0 6 * * 1` (lundi 06:00 UTC).
 *
 * Idempotent : `weekly_rituals.slug` est unique → re-run ne crée pas de doublon.
 * Auth : Bearer CRON_SECRET ou ?secret=$CRON_SECRET (compat Vercel cron + tests manuels).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { askClaudeJSON } from "@/lib/claude";
import {
  isoWeekSlug,
  pickThemeForWeek,
  isoWeekBounds,
} from "@/lib/rituals/theme-rotation";
import {
  RITUAL_HOST_SYSTEM,
  RITUAL_HOST_JSON_SHAPE,
  buildRitualUserMessage,
  getThemeLabelFr,
  type RitualGuidance,
  type RitualTheme,
} from "@/lib/agent/prompts/ritual-host";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    const host = request.headers.get("host") ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === expected) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const slug = isoWeekSlug(now);
  const theme: RitualTheme = pickThemeForWeek(now);
  const { startsAt, endsAt } = isoWeekBounds(now);

  const admin = createServiceClient();

  // Idempotency : on lit avant
  const { data: existing } = await admin
    .from("weekly_rituals")
    .select("id, slug, theme, participants_count")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      action: "skipped_already_exists",
      slug: existing.slug,
      theme: existing.theme,
      participantsCount: existing.participants_count,
    });
  }

  // Génération : opus en priorité, fallback sonnet en cas de timeout/erreur réseau.
  // Opus est le mieux pour la qualité narrative mais peut dépasser maxDuration sous charge.
  let guidance: RitualGuidance;
  let modelUsed: "pro" | "main" = "pro";
  try {
    guidance = await askClaudeJSON<RitualGuidance>(buildRitualUserMessage(theme, slug), {
      model: "pro",
      systemPrompt: RITUAL_HOST_SYSTEM,
      jsonShapeHint: RITUAL_HOST_JSON_SHAPE,
      maxTokens: 3072,
      temperature: 0.7,
    });
  } catch (errPro) {
    // Fallback sonnet (plus rapide, qualité narrative équivalente sur format JSON contraint).
    try {
      guidance = await askClaudeJSON<RitualGuidance>(buildRitualUserMessage(theme, slug), {
        model: "main",
        systemPrompt: RITUAL_HOST_SYSTEM,
        jsonShapeHint: RITUAL_HOST_JSON_SHAPE,
        maxTokens: 3072,
        temperature: 0.7,
      });
      modelUsed = "main";
    } catch (errMain) {
      return NextResponse.json(
        {
          error: "Génération rituel impossible (opus + sonnet en échec).",
          opus: errPro instanceof Error ? errPro.message : String(errPro),
          sonnet: errMain instanceof Error ? errMain.message : String(errMain),
        },
        { status: 502 },
      );
    }
  }

  // Sanity check
  if (
    !guidance.intro_short ||
    !guidance.audio_script_fr ||
    !Array.isArray(guidance.guidance_steps) ||
    guidance.guidance_steps.length === 0
  ) {
    return NextResponse.json(
      { error: "Sortie IA invalide", guidance },
      { status: 502 },
    );
  }

  const i18n = {
    fr: {
      title: getThemeLabelFr(theme),
      ...guidance,
    },
  };

  const { data: inserted, error: insertErr } = await admin
    .from("weekly_rituals")
    .insert({
      slug,
      theme,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      i18n,
      audio_assets: { fr: { source: "client_speech_synthesis", model: modelUsed } },
      participants_count: 0,
    })
    .select("id, slug, theme, starts_at, ends_at")
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: "Insert ritual impossible.", details: insertErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    action: "created",
    ritual: inserted,
  });
}

export const POST = GET;
