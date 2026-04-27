#!/usr/bin/env -S npx tsx
/**
 * Idempotent seed: 3 groupes officiels practice-together (BRIEF §5.7).
 * Upsert par `slug`. Utilise Jitsi Meet (gratuit, RGPD-friendly, no key).
 *
 * Usage:
 *   npx tsx scripts/seed-groups.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: "kaia" },
  auth: { persistSession: false },
});

interface GroupSeed {
  slug: string;
  name: string;
  description: string;
  capacity: number;
  meet_url: string;
  schedule_cron: string;
}

// Jitsi rooms : pas de compte, no tracking. URL change tous les jours via paramètre date.
const seeds: GroupSeed[] = [
  {
    slug: "meditation-matinale",
    name: "Méditation matinale",
    description:
      "Chaque matin à 7h00 (Paris), 12 minutes de méditation guidée en silence partagé. Caméra optionnelle, micro coupé, présence simple.",
    capacity: 12,
    meet_url: "https://meet.jit.si/kaia-meditation-matinale",
    // Lundi-vendredi 7h Paris (06h UTC en hiver, 05h UTC en été — on prend l'hiver par défaut)
    schedule_cron: "0 6 * * 1-5",
  },
  {
    slug: "respiration-soir",
    name: "Respiration du soir",
    description:
      "Tous les soirs à 21h00 (Paris), 10 minutes de respiration cohérente. Pour décompresser ensemble avant la nuit.",
    capacity: 12,
    meet_url: "https://meet.jit.si/kaia-respiration-soir",
    schedule_cron: "0 20 * * *",
  },
  {
    slug: "marche-dimanche",
    name: "Marche consciente du dimanche",
    description:
      "Dimanche à 10h00 (Paris), 30 minutes de marche en pleine conscience. Sortez dehors avec votre téléphone, on partage le silence à distance.",
    capacity: 24,
    meet_url: "https://meet.jit.si/kaia-marche-dimanche",
    schedule_cron: "0 9 * * 0",
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;

  for (const seed of seeds) {
    const { data: existing } = await supabase
      .from("practice_groups")
      .select("id")
      .eq("slug", seed.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("practice_groups")
        .update({
          name: seed.name,
          description: seed.description,
          capacity: seed.capacity,
          meet_url: seed.meet_url,
          schedule_cron: seed.schedule_cron,
          active: true,
        })
        .eq("id", existing.id);
      if (error) {
        console.error(`❌ ${seed.slug}: ${error.message}`);
        continue;
      }
      updated++;
    } else {
      const { error } = await supabase.from("practice_groups").insert({ ...seed, active: true });
      if (error) {
        console.error(`❌ ${seed.slug}: ${error.message}`);
        continue;
      }
      inserted++;
    }
    console.log(`✅ ${seed.slug}`);
  }

  const { count } = await supabase
    .from("practice_groups")
    .select("id", { count: "exact", head: true });
  console.log(`\n📊 inséré=${inserted} · mis-à-jour=${updated} · total en DB=${count ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
