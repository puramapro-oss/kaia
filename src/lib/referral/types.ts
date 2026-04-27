/**
 * Types DB REFERRAL (parrainage particulier) — alignés sur 0001 + 0003.
 */

export interface ReferralRow {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  status: "pending" | "active" | "expired";
  first_payment_at: string | null;
  total_commission_cents: number;
  created_at: string;
}

export interface ReferralCommissionRow {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  source: "subscription_first" | "subscription_recurring" | "shop_purchase";
  amount_cents: number;
  commission_cents: number;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  status: "pending" | "paid" | "reversed";
  paid_at: string | null;
  created_at: string;
}
