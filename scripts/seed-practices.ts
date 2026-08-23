#!/usr/bin/env -S npx tsx
/**
 * Idempotent seed: catalogue de ~80 pratiques KAÏA — 7 catégories.
 *
 * - Upsert par `slug` (re-run sans duplication).
 * - Contenu réel (FR base + EN base i18n). Locales additionnelles ajoutées en P9.
 * - Vérifie le count à la fin.
 *
 * Usage:
 *   npx tsx scripts/seed-practices.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { ALL_PRACTICES } from "./seed-practices";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: "kaia" },
  auth: { persistSession: false },
});

async function main() {
  // Sanity: check that schema kaia is reachable
  const { error: headErr } = await supabase.from("practices").select("id", { count: "exact", head: true });
  if (headErr) {
    console.error("Cannot reach kaia.practices:", headErr.message);
    process.exit(1);
  }

  // Upsert by slug — chunks of 20 to avoid payload limits
  for (let i = 0; i < ALL_PRACTICES.length; i += 20) {
    const chunk = ALL_PRACTICES.slice(i, i + 20);
    const rows = chunk.map((p) => ({
      slug: p.slug,
      category: p.category,
      title: p.title,
      duration_seconds: p.duration_seconds,
      intensity: p.intensity,
      goal_tags: p.goal_tags,
      contraindications: p.contraindications,
      steps: p.steps,
      i18n: p.i18n,
      audio_assets: {},
      premium_only: p.premium_only,
      active: true,
    }));
    const { error } = await supabase.from("practices").upsert(rows, { onConflict: "slug" });
    if (error) {
      console.error(`❌ Upsert chunk ${i}-${i + chunk.length}:`, error.message);
      process.exit(1);
    }
  }

  const { count, error: countErr } = await supabase
    .from("practices")
    .select("id", { count: "exact", head: true });
  if (countErr) {
    console.error("Count error:", countErr.message);
    process.exit(1);
  }

  console.warn(`✅ Seeded ${ALL_PRACTICES.length} practices. Total in DB: ${count}`);

  // Per-category breakdown
  const cats: Array<"meditation" | "breathing" | "mantra" | "mudra" | "movement" | "learning" | "reprogramming"> = [
    "meditation",
    "breathing",
    "mantra",
    "mudra",
    "movement",
    "learning",
    "reprogramming",
  ];
  for (const c of cats) {
    const { count: cCount } = await supabase
      .from("practices")
      .select("id", { count: "exact", head: true })
      .eq("category", c);
    console.warn(`  ${c}: ${cCount}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
