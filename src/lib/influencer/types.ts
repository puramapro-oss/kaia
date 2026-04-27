/**
 * Types DB INFLUENCER — alignés sur migration 0001 + 0003.
 *
 * Côté code on lit/écrit uniquement par ces interfaces pour rester typé,
 * sans dépendre de `database.types.ts` généré (workflow PURAMA).
 */

export interface InfluencerApplicationRow {
  id: string;
  user_id: string;
  socials: Record<string, string | null>;
  audience_size: number | null;
  pitch: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface InfluencerLinkRow {
  id: string;
  user_id: string;
  code: string;
  campaign: string | null;
  active: boolean;
  /** P6 (migration 0003) — peut être absent si migration non appliquée. */
  promo_active_until: string | null;
  promo_discount_percent: number | null;
  base_commission_first: number | null;
  lifetime_commission: number | null;
  custom_landing_url: string | null;
  created_at: string;
}

export interface InfluencerConversionRow {
  id: string;
  link_id: string;
  referred_user_id: string | null;
  stripe_invoice_id: string | null;
  amount_cents: number;
  commission_cents: number;
  kind: "first_payment" | "recurring";
  status: "pending" | "paid" | "reversed";
  paid_at: string | null;
  created_at: string;
}

export interface InfluencerPayoutRow {
  id: string;
  user_id: string;
  amount_cents: number;
  status: "pending" | "processing" | "paid" | "failed";
  iban: string | null;
  paid_at: string | null;
  /** P6 (migration 0003). */
  period_start: string | null;
  period_end: string | null;
  breakdown: Record<string, unknown>;
  treezor_transaction_id: string | null;
  notes: string | null;
  created_at: string;
}
