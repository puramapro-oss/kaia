/**
 * CRON `/api/core/world-radar` — LUNA analyse le contexte collectif du jour et,
 * si le score dépasse le seuil, crée automatiquement un événement C.O.R.E.
 * Schedule (vercel.json) : `0 6 * * *` (06:00 UTC chaque jour).
 *
 * Idempotent : un seul événement auto-créé par jour (skip si déjà présent).
 * Auth : Bearer CRON_SECRET ou ?secret=$CRON_SECRET.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { askClaudeJSON } from "@/lib/claude";
import {
  WORLD_RADAR_SYSTEM,
  WORLD_RADAR_JSON_SHAPE,
  buildWorldRadarUserMessage,
  normalizeRadarResult,
  shouldAutoCreateEvent,
  type WorldRadarResult,
} from "@/lib/core/world-radar";

export const runtime = "nodejs";
export const maxDuration = 60;

const MOON_PHASES = ["nouvelle", "croissante", "pleine", "décroissante"] as const;
const SEASONS = ["hiver", "printemps", "été", "automne"] as const;

/** Phase lunaire approximative via le cycle synodique (29.53j) depuis une nouvelle lune de référence. */
function moonPhase(date: Date): string {
  const ref = Date.UTC(2000, 0, 6, 18, 14); // nouvelle lune 2000-01-06
  const days = (date.getTime() - ref) / 86_400_000;
  const pos = ((days % 29.53) + 29.53) % 29.53;
  return MOON_PHASES[Math.floor((pos / 29.53) * 4) % 4];
}

/** Saison (hémisphère nord) à partir du mois. */
function season(date: Date): string {
  return SEASONS[Math.floor(((date.getUTCMonth() + 1) % 12) / 3)];
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const service = createServiceClient();

  // Idempotency : un seul événement radar par jour.
  const { data: existing } = await service
    .from("core_events")
    .select("id")
    .eq("auto_created_by_radar", true)
    .gte("created_at", dayStart.toISOString())
    .lt("created_at", dayEnd.toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, action: "skipped_already_created" });
  }

  let result: WorldRadarResult;
  try {
    const raw = await askClaudeJSON<WorldRadarResult>(
      buildWorldRadarUserMessage({
        date: dayStart.toISOString().slice(0, 10),
        moonPhase: moonPhase(now),
        season: season(now),
      }),
      {
        model: "main",
        systemPrompt: WORLD_RADAR_SYSTEM,
        jsonShapeHint: WORLD_RADAR_JSON_SHAPE,
        maxTokens: 800,
        temperature: 0.7,
      },
    );
    result = normalizeRadarResult(raw);
  } catch (err) {
    return NextResponse.json(
      { error: "Analyse Radar Mondial impossible.", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  if (!shouldAutoCreateEvent(result) || !result.eventPack) {
    return NextResponse.json({ ok: true, action: "no_event", score: result.score, reading: result.reading });
  }

  const pack = result.eventPack;
  const startsAt = new Date(now.getTime() + 60 * 60 * 1000); // dans 1h
  const momentZ = new Date(startsAt.getTime() + pack.momentZOffsetMin * 60 * 1000);
  const endsAt =
    pack.type === "now"
      ? new Date(startsAt.getTime() + 60 * 60 * 1000)
      : pack.type === "24h"
        ? new Date(startsAt.getTime() + 24 * 60 * 60 * 1000)
        : new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: created, error: insertErr } = await service
    .from("core_events")
    .insert({
      creator_id: null,
      type: pack.type,
      title: pack.title,
      description: pack.description,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      synchronization_moment_z: momentZ.toISOString(),
      auto_created_by_radar: true,
      world_radar_score: result.score,
      status: "active",
    })
    .select("id, title, type")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: "Insert événement impossible.", details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: "created", score: result.score, event: created });
}

export const POST = GET;
