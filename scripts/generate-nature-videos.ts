#!/usr/bin/env tsx
/**
 * KAÏA — Génération des 12 boucles nature 4K via Replicate.
 *
 * IMPORTANT : ce script est en DRY-RUN par défaut. Il N'APPELLE PAS l'API
 * Replicate tant qu'on lui passe `--execute`. Il sert d'abord à :
 *   - lister les 12 prompts à générer ;
 *   - estimer le coût ;
 *   - confirmer le plan avant de consommer des crédits.
 *
 * Usage :
 *   npm run videos:nature:plan       # dry-run (default)
 *   REPLICATE_API_TOKEN=r8_xxx \
 *     npm run videos:nature:generate # exécution réelle
 *
 * Modèle ciblé : `wan-2.1-t2v-1.3b` (Wan 2.1 text-to-video, 480p baseline,
 * up-rendable 4K via Topaz P5+). Si Tissma préfère un autre modèle (HunyuanVideo,
 * CogVideoX, Mochi-1, ou Sora si dispo via Replicate), changer `REPLICATE_MODEL`.
 *
 * Coût indicatif Replicate (avril 2026, à reconfirmer avant exécution) :
 *   wan-2.1-t2v-1.3b ~ 0.008-0.02 $ / s de vidéo générée.
 *   12 vidéos × 8 s = ~ 1$ - 2$ total. Très raisonnable.
 *
 * Output : `public/videos/nature/{slug}.mp4` puis `compress` script séparé
 * pour AV1/WebM fallback (cf. README dans `public/videos/nature/`).
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NATURE_TOKENS } from "../src/lib/multisensorial/motion-tokens";

const REPLICATE_MODEL = process.env.REPLICATE_MODEL ?? "wan-2.1-t2v-1.3b";
const OUTPUT_DIR = resolve(process.cwd(), "public/videos/nature");
const FPS = 24;
const DURATION_SEC = 8;

const args = new Set(process.argv.slice(2));
const EXECUTE = args.has("--execute");
const FILTER_SLUG = process.argv.find((arg) => arg.startsWith("--slug="))?.split("=")[1];

interface PromptPlan {
  slug: string;
  labelFr: string;
  prompt: string;
  estimatedCostUsd: number;
}

function buildPlan(): PromptPlan[] {
  return NATURE_TOKENS.filter(
    (token) => !FILTER_SLUG || token.slug === FILTER_SLUG
  ).map((token) => ({
    slug: token.slug,
    labelFr: token.labelFr,
    prompt: token.replicatePrompt,
    estimatedCostUsd: 0.015 * DURATION_SEC,
  }));
}

function logPlan(plan: PromptPlan[]) {
  const total = plan.reduce((sum, item) => sum + item.estimatedCostUsd, 0);
  process.stdout.write("\nKAÏA — Plan de génération vidéos nature\n");
  process.stdout.write(`Modèle  : ${REPLICATE_MODEL}\n`);
  process.stdout.write(`Format  : ${DURATION_SEC}s @ ${FPS}fps, 1024×576 (puis upscale 4K P5+)\n`);
  process.stdout.write(`Sortie  : ${OUTPUT_DIR}/{slug}.mp4\n`);
  process.stdout.write(`Total   : ${plan.length} clip(s) — coût estimé ~ $${total.toFixed(2)}\n`);
  process.stdout.write("─".repeat(72) + "\n");
  for (const item of plan) {
    process.stdout.write(`• ${item.slug.padEnd(10)} | ${item.labelFr.padEnd(22)} | ~$${item.estimatedCostUsd.toFixed(3)}\n`);
    process.stdout.write(`  prompt: ${item.prompt.slice(0, 110)}…\n`);
  }
  process.stdout.write("\n");
}

interface ReplicatePredictionResponse {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string | null;
  urls?: { get?: string };
}

async function pollPrediction(id: string, token: string): Promise<ReplicatePredictionResponse> {
  for (let attempt = 0; attempt < 120; attempt++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Replicate poll failed (${response.status}): ${await response.text()}`);
    }
    const json = (await response.json()) as ReplicatePredictionResponse;
    if (json.status === "succeeded" || json.status === "failed" || json.status === "canceled") {
      return json;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Replicate prediction timed out (10 min)");
}

async function generateOne(item: PromptPlan, token: string): Promise<void> {
  process.stdout.write(`\n→ ${item.slug} : génération…\n`);
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL,
      input: {
        prompt: item.prompt,
        num_frames: DURATION_SEC * FPS,
        fps: FPS,
        aspect_ratio: "16:9",
        seed: Math.floor(Math.random() * 1_000_000),
      },
    }),
  });
  if (!create.ok) {
    const body = await create.text();
    throw new Error(`Create prediction failed (${create.status}): ${body}`);
  }
  const created = (await create.json()) as ReplicatePredictionResponse;
  const final = await pollPrediction(created.id, token);
  if (final.status !== "succeeded") {
    throw new Error(`Prediction ${final.status}: ${final.error ?? "(no message)"}`);
  }
  const url = Array.isArray(final.output) ? final.output[0] : final.output;
  if (!url) throw new Error("No output URL returned by Replicate");

  const videoRes = await fetch(url);
  if (!videoRes.ok) {
    throw new Error(`Download failed (${videoRes.status})`);
  }
  const buffer = Buffer.from(await videoRes.arrayBuffer());
  const dest = resolve(OUTPUT_DIR, `${item.slug}.mp4`);
  await writeFile(dest, buffer);
  process.stdout.write(`✓ ${item.slug} → ${dest} (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB)\n`);
}

async function main() {
  const plan = buildPlan();
  logPlan(plan);

  if (!EXECUTE) {
    process.stdout.write("Dry-run — aucun crédit consommé. Relance avec --execute pour générer.\n");
    process.stdout.write("Ex : REPLICATE_API_TOKEN=r8_xxx tsx scripts/generate-nature-videos.ts --execute\n\n");
    return;
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    process.stderr.write("REPLICATE_API_TOKEN manquant. Abort.\n");
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`Mode EXECUTE — ${plan.length} génération(s)…\n`);
  for (const item of plan) {
    try {
      await generateOne(item, token);
    } catch (error) {
      process.stderr.write(`✗ ${item.slug} : ${(error as Error).message}\n`);
    }
  }
  process.stdout.write("\nTerminé. Pense à compresser (CRF 28 + AV1) avant commit.\n");
}

main().catch((error) => {
  process.stderr.write(`Fatal: ${(error as Error).message}\n`);
  process.exitCode = 1;
});
