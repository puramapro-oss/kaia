#!/usr/bin/env -S npx tsx
/**
 * Seed boutique KAÏA — 4 produits digitaux VIDA initiaux.
 * Idempotent par slug (ON CONFLICT DO UPDATE).
 *
 * Usage: npm run seed:products
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SERVICE_KEY");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "kaia" },
});

interface SeedProduct {
  slug: string;
  kind: "digital" | "physical";
  title: string;
  description: string;
  price_cents: number;
  metadata: Record<string, unknown>;
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "audio-meditation-foret-guidee",
    kind: "digital",
    title: "Audio méditation guidée — Forêt enchantée",
    description:
      "20 minutes de méditation immersive enregistrées dans une forêt vivante. Voix professionnelle, sons binauraux Theta 6 Hz.",
    price_cents: 499,
    metadata: {
      duration_min: 20,
      tags: ["meditation", "binaural", "audio"],
      cover_emoji: "🌲",
    },
  },
  {
    slug: "ebook-respiration-21j",
    kind: "digital",
    title: "Ebook : Respiration 21 jours",
    description:
      "Programme PDF illustré de 80 pages. Cohérence cardiaque, 4-7-8, Wim Hof — un protocole différent chaque jour pour 21 jours.",
    price_cents: 999,
    metadata: {
      pages: 80,
      format: "pdf",
      tags: ["breathing", "ebook", "21j"],
      cover_emoji: "📘",
    },
  },
  {
    slug: "programme-routine-21j",
    kind: "digital",
    title: "Programme routine VIDA — 21 jours",
    description:
      "Plan complet 21 jours avec routine matin (10 min) + soir (15 min). Suivi quotidien dans l'app, badges + +500 tokens à la fin.",
    price_cents: 1999,
    metadata: {
      duration_days: 21,
      tokens_bonus: 500,
      tags: ["program", "21j"],
      cover_emoji: "🎯",
    },
  },
  {
    slug: "pack-mantras-sacres",
    kind: "digital",
    title: "Pack 10 mantras sacrés multilingues",
    description:
      "10 mantras chantés (sanskrit, hindi, FR, EN) — 5 minutes chacun. Audio HD + livret PDF des intentions et postures.",
    price_cents: 1499,
    metadata: {
      tracks: 10,
      languages: ["sanskrit", "hindi", "fr", "en"],
      tags: ["mantra", "audio"],
      cover_emoji: "🕉️",
    },
  },
];

async function upsertProduct(p: SeedProduct): Promise<{ slug: string; status: string }> {
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("slug", p.slug)
    .maybeSingle();
  if (existing) {
    const { error } = await admin
      .from("products")
      .update({
        title: p.title,
        description: p.description,
        price_cents: p.price_cents,
        kind: p.kind,
        metadata: p.metadata,
        active: true,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { slug: p.slug, status: "updated" };
  }
  const { error } = await admin.from("products").insert({
    slug: p.slug,
    kind: p.kind,
    title: p.title,
    description: p.description,
    price_cents: p.price_cents,
    metadata: p.metadata,
    active: true,
  });
  if (error) throw error;
  return { slug: p.slug, status: "created" };
}

async function main() {
  console.log("🛍️  Seed boutique KAÏA — 4 produits");
  for (const p of PRODUCTS) {
    try {
      const r = await upsertProduct(p);
      console.log(`  ${r.status === "created" ? "✓" : "↻"} ${r.slug} (${r.status})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${p.slug} — ${msg}`);
    }
  }
  console.log("✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
