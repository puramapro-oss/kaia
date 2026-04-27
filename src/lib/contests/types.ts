/**
 * Types DB miroir pour `kaia.contests` et `kaia.contest_entries`.
 */

export type ContestKind = "weekly" | "monthly" | "yearly" | "special";
export type ContestStatus = "upcoming" | "live" | "drawing" | "completed" | "canceled";

export interface ContestPrize {
  rank: number;
  label: string;
  type: "tokens" | "subscription_credit" | "product" | "discount" | "cash_phase2";
  value: number; // tokens, mois, € * 100, etc selon type
  currency?: "EUR" | "TOKENS" | "MONTHS";
}

export interface ContestRow {
  id: string;
  slug: string;
  kind: ContestKind;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  draw_at: string;
  pool_amount: number;
  status: ContestStatus;
  winners: Array<{
    rank: number;
    userId: string;
    tickets: number;
    prizeIndex: number;
  }>;
  prizes: ContestPrize[];
  proof_signature: string | null;
  proof_timestamp_ots: string | null;
  rules_url: string | null;
  draw_seed: string | null;
  created_at: string;
}

export interface ContestEntryRow {
  id: string;
  contest_id: string;
  user_id: string;
  tickets: number;
  source: string;
  created_at: string;
}
