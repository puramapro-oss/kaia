import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export interface KaiaPlan {
  key: "monthly" | "yearly";
  priceCents: number;
  priceLabel: string;
  intervalLabel: string;
  envPriceId: string;
  trialDays: number;
}

export const KAIA_PLANS: KaiaPlan[] = [
  {
    key: "monthly",
    priceCents: 1499,
    priceLabel: "14,99 €",
    intervalLabel: "/mois",
    envPriceId: process.env.STRIPE_PRICE_MONTHLY ?? "",
    trialDays: 14,
  },
  {
    key: "yearly",
    priceCents: 12591,
    priceLabel: "125,91 €",
    intervalLabel: "/an",
    envPriceId: process.env.STRIPE_PRICE_YEARLY ?? "",
    trialDays: 14,
  },
];

export const KAIA_COUPONS = {
  INFLUENCER_50OFF: "INFLUENCER_50OFF",
  LAUNCH10: "LAUNCH10",
  ANNUAL30: "ANNUAL30",
} as const;

export function getPlan(key: KaiaPlan["key"]): KaiaPlan {
  const plan = KAIA_PLANS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown KAÏA plan: ${key}`);
  return plan;
}
