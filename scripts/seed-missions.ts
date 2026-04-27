#!/usr/bin/env -S npx tsx
/**
 * Seed missions KAÏA — 12 missions Phase 1.
 *  - solo : routines complétées, méditation, respiration, apprentissages
 *  - humanitarian : don, mentor, action terrain
 *  - marketing : story / Reel / DM témoignage / abonnement social
 *
 * 🚫 INTERDIT formellement : « note l'app sur App Store / Google Play »
 *    (Apple 5.3 + Google) — voir BRIEF §risques #1 et §12.1.
 *
 * Idempotent par slug.
 *
 * Usage: npm run seed:missions
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

interface SeedMission {
  slug: string;
  kind: "solo" | "humanitarian" | "marketing" | "collaborative";
  title: string;
  description: string;
  reward_tokens: number;
  proof_kind: "photo" | "gps" | "qr" | "api" | "ai";
  max_completions: number | null;
  i18n: { fr: { title: string; description: string }; en?: { title: string; description: string } };
}

const MISSIONS: SeedMission[] = [
  // ─── SOLO ─────────────────────────────────────────────────────────────────
  {
    slug: "streak-7-days",
    kind: "solo",
    title: "Streak 7 jours",
    description:
      "Termine ta routine quotidienne 7 jours d'affilée. Validation automatique par l'app dès que ton streak atteint 7.",
    reward_tokens: 200,
    proof_kind: "api",
    max_completions: 1,
    i18n: {
      fr: {
        title: "Streak 7 jours",
        description: "7 jours consécutifs de routine. Validation auto.",
      },
      en: {
        title: "7-day streak",
        description: "7 consecutive days of routine. Auto-validated.",
      },
    },
  },
  {
    slug: "ten-meditations",
    kind: "solo",
    title: "10 méditations",
    description:
      "Termine 10 sessions de méditation guidée. Validation automatique dès le 10ᵉ pratique terminée.",
    reward_tokens: 150,
    proof_kind: "api",
    max_completions: 1,
    i18n: {
      fr: { title: "10 méditations", description: "10 sessions guidées." },
      en: { title: "10 meditations", description: "10 guided sessions." },
    },
  },
  {
    slug: "fifty-breathings",
    kind: "solo",
    title: "50 cycles de respiration",
    description: "Cumule 50 cycles de respiration guidée toutes pratiques confondues.",
    reward_tokens: 100,
    proof_kind: "api",
    max_completions: 1,
    i18n: {
      fr: { title: "50 cycles de respiration", description: "Cumule 50 cycles." },
      en: { title: "50 breathing cycles", description: "Accumulate 50 cycles." },
    },
  },
  {
    slug: "first-builder-routine",
    kind: "solo",
    title: "Crée ta routine personnalisée",
    description:
      "Utilise le builder pour créer ta routine sur-mesure. Validation auto à la 1ʳᵉ génération.",
    reward_tokens: 50,
    proof_kind: "api",
    max_completions: 1,
    i18n: {
      fr: {
        title: "Crée ta routine personnalisée",
        description: "1ʳᵉ génération via builder.",
      },
      en: {
        title: "Create your personalized routine",
        description: "First generation via builder.",
      },
    },
  },

  // ─── HUMANITAIRE ──────────────────────────────────────────────────────────
  {
    slug: "first-donation-vida",
    kind: "humanitarian",
    title: "Premier don à VIDA Asso",
    description:
      "Fais ton premier don (montant libre) à l'Association PURAMA. Tokens crédités auto en plus du reçu fiscal.",
    reward_tokens: 100,
    proof_kind: "api",
    max_completions: 1,
    i18n: {
      fr: { title: "Premier don à VIDA Asso", description: "Don validé = tokens bonus." },
      en: { title: "First donation to VIDA Asso", description: "Donation validated = bonus tokens." },
    },
  },
  {
    slug: "field-action-photo",
    kind: "humanitarian",
    title: "Action terrain (photo)",
    description:
      "Réalise une action concrète de bien-être collectif (ramassage déchets, méditation publique, accompagnement). Upload une photo en preuve. Validation admin sous 48h.",
    reward_tokens: 300,
    proof_kind: "photo",
    max_completions: 5,
    i18n: {
      fr: {
        title: "Action terrain",
        description: "Photo + validation admin sous 48h.",
      },
      en: {
        title: "Field action",
        description: "Photo + admin validation within 48h.",
      },
    },
  },
  {
    slug: "mentor-newcomer",
    kind: "humanitarian",
    title: "Mentor un nouveau membre",
    description:
      "Accompagne un nouveau membre via la communauté KAÏA pendant 7 jours minimum. Joins une preuve (capture d'échange).",
    reward_tokens: 200,
    proof_kind: "photo",
    max_completions: 3,
    i18n: {
      fr: {
        title: "Mentor un nouveau membre",
        description: "7j d'accompagnement + preuve.",
      },
      en: {
        title: "Mentor a newcomer",
        description: "7-day mentorship + proof.",
      },
    },
  },

  // ─── MARKETING (100 % légal) ──────────────────────────────────────────────
  {
    slug: "share-story-instagram",
    kind: "marketing",
    title: "Story Instagram avec lien parrainage",
    description:
      "Partage une story Instagram avec ton lien de parrainage. Lien doit mentionner #ad ou « lien sponsorisé ». Upload le screenshot.",
    reward_tokens: 50,
    proof_kind: "photo",
    max_completions: 4,
    i18n: {
      fr: {
        title: "Story Instagram (#ad)",
        description: "Story avec lien parrain + #ad.",
      },
      en: {
        title: "Instagram story (#ad)",
        description: "Story with referral link + #ad.",
      },
    },
  },
  {
    slug: "share-story-tiktok",
    kind: "marketing",
    title: "Story / vidéo TikTok",
    description:
      "Publie une vidéo TikTok dédiée à VIDA ROUTINE (≥ 15 s). Mention « partenariat rémunéré » ou #ad obligatoire. Upload le lien.",
    reward_tokens: 200,
    proof_kind: "photo",
    max_completions: 2,
    i18n: {
      fr: {
        title: "Vidéo TikTok",
        description: "Vidéo dédiée VIDA + #ad.",
      },
      en: {
        title: "TikTok video",
        description: "VIDA-dedicated video + #ad.",
      },
    },
  },
  {
    slug: "reel-instagram-dedicated",
    kind: "marketing",
    title: "Reel Instagram dédié",
    description:
      "Réalise un Reel Instagram dédié à ta pratique avec KAÏA (≥ 30 s). #ad ou « partenariat rémunéré » obligatoire.",
    reward_tokens: 500,
    proof_kind: "photo",
    max_completions: 1,
    i18n: {
      fr: {
        title: "Reel Instagram dédié",
        description: "Reel ≥ 30s + #ad.",
      },
      en: {
        title: "Dedicated Instagram Reel",
        description: "Reel ≥ 30s + #ad.",
      },
    },
  },
  {
    slug: "dm-testimonial-vida",
    kind: "marketing",
    title: "DM témoignage à VIDA",
    description:
      "Envoie un témoignage en DM aux comptes officiels VIDA Insta + TikTok. Upload une capture d'écran.",
    reward_tokens: 50,
    proof_kind: "photo",
    max_completions: 1,
    i18n: {
      fr: { title: "DM témoignage", description: "DM Insta + TikTok officiel VIDA." },
      en: { title: "DM testimonial", description: "DM official VIDA accounts." },
    },
  },
  {
    slug: "subscribe-vida-socials",
    kind: "marketing",
    title: "Abonne-toi aux comptes VIDA",
    description:
      "Abonne-toi aux comptes officiels VIDA (Instagram + TikTok + YouTube). Upload une capture des 3 abonnements.",
    reward_tokens: 30,
    proof_kind: "photo",
    max_completions: 1,
    i18n: {
      fr: { title: "Abonne-toi aux 3 comptes VIDA", description: "Insta + TikTok + YouTube." },
      en: { title: "Follow the 3 VIDA accounts", description: "IG + TikTok + YouTube." },
    },
  },
];

async function upsertMission(m: SeedMission): Promise<{ slug: string; status: string }> {
  const { data: existing } = await admin
    .from("missions")
    .select("id")
    .eq("slug", m.slug)
    .maybeSingle();
  if (existing) {
    const { error } = await admin
      .from("missions")
      .update({
        kind: m.kind,
        title: m.title,
        description: m.description,
        reward_tokens: m.reward_tokens,
        reward_funder_kind: "kaia",
        proof_kind: m.proof_kind,
        max_completions: m.max_completions,
        active: true,
        i18n: m.i18n,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return { slug: m.slug, status: "updated" };
  }
  const { error } = await admin.from("missions").insert({
    slug: m.slug,
    kind: m.kind,
    title: m.title,
    description: m.description,
    reward_tokens: m.reward_tokens,
    reward_funder_kind: "kaia",
    proof_kind: m.proof_kind,
    max_completions: m.max_completions,
    active: true,
    i18n: m.i18n,
  });
  if (error) throw error;
  return { slug: m.slug, status: "created" };
}

async function main() {
  console.log(`🎯 Seed missions KAÏA — ${MISSIONS.length} missions Phase 1`);
  console.log(`   ⚠️  AUCUNE mission « note sur App Store » (Apple 5.3 + Google)`);
  for (const m of MISSIONS) {
    try {
      const r = await upsertMission(m);
      console.log(`  ${r.status === "created" ? "✓" : "↻"} ${r.slug} (${r.status}) — ${m.reward_tokens} tokens`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${m.slug} — ${msg}`);
    }
  }
  console.log("✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
