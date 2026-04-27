/**
 * Garantit qu'un concours pour la période courante existe (idempotent par slug).
 * Utilisé par les 3 CRON cadenciers (weekly, monthly, yearly).
 *
 *  - Si le concours du slug existe → no-op
 *  - Sinon insert avec prizes par défaut + status='live' si la fenêtre est ouverte
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import { windowFor, type Cadence } from "./period";
import type { ContestPrize } from "./types";

type AdminClient = ReturnType<typeof createServiceClient>;

const DEFAULT_PRIZES: Record<Cadence, ContestPrize[]> = {
  weekly: [
    { rank: 1, label: "1 mois Premium offert", type: "subscription_credit", value: 1, currency: "MONTHS" },
    { rank: 2, label: "1500 tokens VIDA", type: "tokens", value: 1500, currency: "TOKENS" },
    { rank: 3, label: "1000 tokens VIDA", type: "tokens", value: 1000, currency: "TOKENS" },
    { rank: 4, label: "750 tokens VIDA", type: "tokens", value: 750, currency: "TOKENS" },
    { rank: 5, label: "500 tokens VIDA", type: "tokens", value: 500, currency: "TOKENS" },
    { rank: 6, label: "300 tokens VIDA", type: "tokens", value: 300, currency: "TOKENS" },
    { rank: 7, label: "250 tokens VIDA", type: "tokens", value: 250, currency: "TOKENS" },
    { rank: 8, label: "200 tokens VIDA", type: "tokens", value: 200, currency: "TOKENS" },
    { rank: 9, label: "150 tokens VIDA", type: "tokens", value: 150, currency: "TOKENS" },
    { rank: 10, label: "100 tokens VIDA", type: "tokens", value: 100, currency: "TOKENS" },
  ],
  monthly: [
    { rank: 1, label: "3 mois Premium offerts", type: "subscription_credit", value: 3, currency: "MONTHS" },
    { rank: 2, label: "2 mois Premium offerts", type: "subscription_credit", value: 2, currency: "MONTHS" },
    { rank: 3, label: "1 mois Premium offert", type: "subscription_credit", value: 1, currency: "MONTHS" },
    { rank: 4, label: "5000 tokens VIDA", type: "tokens", value: 5000, currency: "TOKENS" },
    { rank: 5, label: "3000 tokens VIDA", type: "tokens", value: 3000, currency: "TOKENS" },
    { rank: 6, label: "2000 tokens VIDA", type: "tokens", value: 2000, currency: "TOKENS" },
    { rank: 7, label: "1500 tokens VIDA", type: "tokens", value: 1500, currency: "TOKENS" },
    { rank: 8, label: "1000 tokens VIDA", type: "tokens", value: 1000, currency: "TOKENS" },
    { rank: 9, label: "750 tokens VIDA", type: "tokens", value: 750, currency: "TOKENS" },
    { rank: 10, label: "500 tokens VIDA", type: "tokens", value: 500, currency: "TOKENS" },
  ],
  yearly: [
    { rank: 1, label: "1 an Premium + dotation partenaire", type: "subscription_credit", value: 12, currency: "MONTHS" },
    { rank: 2, label: "6 mois Premium", type: "subscription_credit", value: 6, currency: "MONTHS" },
    { rank: 3, label: "3 mois Premium + 10000 tokens", type: "subscription_credit", value: 3, currency: "MONTHS" },
    { rank: 4, label: "30000 tokens VIDA", type: "tokens", value: 30000, currency: "TOKENS" },
    { rank: 5, label: "20000 tokens VIDA", type: "tokens", value: 20000, currency: "TOKENS" },
    { rank: 6, label: "15000 tokens VIDA", type: "tokens", value: 15000, currency: "TOKENS" },
    { rank: 7, label: "10000 tokens VIDA", type: "tokens", value: 10000, currency: "TOKENS" },
    { rank: 8, label: "8000 tokens VIDA", type: "tokens", value: 8000, currency: "TOKENS" },
    { rank: 9, label: "6000 tokens VIDA", type: "tokens", value: 6000, currency: "TOKENS" },
    { rank: 10, label: "5000 tokens VIDA", type: "tokens", value: 5000, currency: "TOKENS" },
  ],
};

const TITLE: Record<Cadence, (slug: string) => string> = {
  weekly: (s) => `Tirage hebdo · ${s}`,
  monthly: (s) => `Tirage mensuel · ${s}`,
  yearly: (s) => `Grand tirage annuel · ${s}`,
};

const DESCRIPTION: Record<Cadence, string> = {
  weekly: "10 gagnants chaque dimanche 20:00 UTC. Plus tu fais ta routine, plus tu as de tickets.",
  monthly: "10 gagnants tirés le 1er du mois suivant à 12:00 UTC. Tickets accumulés sur toute la période.",
  yearly: "10 grands gagnants le 31/12 à 23:30 UTC. Le tirage de l'année.",
};

export interface EnsureResult {
  contestId: string;
  slug: string;
  created: boolean;
}

export async function ensurePeriodContest(params: {
  admin: AdminClient;
  cadence: Cadence;
  now?: Date;
}): Promise<EnsureResult> {
  const { admin, cadence } = params;
  const now = params.now ?? new Date();
  const win = windowFor(cadence, now);
  const slug = `${cadence}-${win.slug}`;

  // Check existence
  const { data: existing } = await admin
    .from("contests")
    .select("id, slug, status")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    // Si on a manqué la transition upcoming→live, on flippe
    if (existing.status === "upcoming" && now >= win.startsAt && now <= win.endsAt) {
      await admin.from("contests").update({ status: "live" }).eq("id", existing.id);
    }
    return { contestId: existing.id, slug, created: false };
  }

  const status = now < win.startsAt ? "upcoming" : now > win.endsAt ? "drawing" : "live";

  const { data: created, error } = await admin
    .from("contests")
    .insert({
      slug,
      kind: cadence,
      title: TITLE[cadence](win.slug),
      description: DESCRIPTION[cadence],
      starts_at: win.startsAt.toISOString(),
      ends_at: win.endsAt.toISOString(),
      draw_at: win.drawAt.toISOString(),
      status,
      prizes: DEFAULT_PRIZES[cadence],
      pool_amount: 0,
      rules_url: "/legal/contests-rules",
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    // Race condition — re-fetch
    const { data: fallback } = await admin
      .from("contests")
      .select("id, slug")
      .eq("slug", slug)
      .single();
    return { contestId: fallback?.id ?? "", slug, created: false };
  }
  return { contestId: created.id, slug, created: true };
}
