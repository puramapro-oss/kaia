import Stripe from "stripe";
import type { VitaePlanKey } from "./constants";

function envTrim(value: string | undefined): string | undefined {
  return value?.replace(/\\n/g, "").replace(/[\r\n\t ]+$/g, "").replace(/^\s+/, "") || undefined;
}

export const stripe = new Stripe(envTrim(process.env.STRIPE_SECRET_KEY) ?? "", {
  typescript: true,
});

export interface VitaePlan {
  key: VitaePlanKey;
  priceCents: number;
  priceLabel: string;
  multiplier: number;
  envPriceId: string;
  envPriceIdAnnual: string;
  trialDays: number;
  description: string;
}

export const VITAE_PLANS: VitaePlan[] = [
  {
    key: "essentiel",
    priceCents: 1499,
    priceLabel: "14,99 €",
    multiplier: 1,
    envPriceId: process.env.STRIPE_PRICE_ESSENTIEL ?? "",
    envPriceIdAnnual: process.env.STRIPE_PRICE_ESSENTIEL_ANNUAL ?? "",
    trialDays: 14,
    description: "Accès essentiel — 1× multiplicateur KARMA",
  },
  {
    key: "infini",
    priceCents: 2999,
    priceLabel: "29,99 €",
    multiplier: 5,
    envPriceId: process.env.STRIPE_PRICE_INFINI ?? "",
    envPriceIdAnnual: process.env.STRIPE_PRICE_INFINI_ANNUAL ?? "",
    trialDays: 14,
    description: "Accès infini — 5× multiplicateur KARMA",
  },
  {
    key: "legende",
    priceCents: 9999,
    priceLabel: "99,99 €",
    multiplier: 10,
    envPriceId: process.env.STRIPE_PRICE_LEGENDE ?? "",
    envPriceIdAnnual: process.env.STRIPE_PRICE_LEGENDE_ANNUAL ?? "",
    trialDays: 14,
    description: "Accès légende — 10× multiplicateur KARMA",
  },
];

export function getVitaePlan(key: VitaePlanKey): VitaePlan | undefined {
  return VITAE_PLANS.find((p) => p.key === key);
}

export async function createCheckoutSession(
  userId: string,
  planKey: VitaePlanKey,
  returnUrl: string,
  billing: "monthly" | "annual" = "monthly"
): Promise<string> {
  const plan = getVitaePlan(planKey);
  if (!plan) throw new Error(`Plan inconnu: ${planKey}`);

  const priceId = billing === "annual" ? plan.envPriceIdAnnual : plan.envPriceId;
  if (!priceId) throw new Error(`Price ID manquant pour: ${planKey} (${billing})`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: plan.trialDays,
      metadata: { user_id: userId, plan_key: planKey, billing, app: "kaia" },
    },
    metadata: { user_id: userId, plan_key: planKey, billing, app: "kaia" },
    success_url: `${returnUrl}?checkout=success&plan=${planKey}&billing=${billing}`,
    cancel_url: `${returnUrl}?checkout=canceled`,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe session URL manquante");
  return session.url;
}

export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function createConnectAccountSession(accountId: string): Promise<string> {
  const session = await stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: { enabled: true },
      account_management: { enabled: true },
      payouts: { enabled: true },
      balances: { enabled: true },
    },
  });
  return session.client_secret;
}

export async function createConnectAccount(
  email: string,
  userId: string
): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email,
    capabilities: { transfers: { requested: true } },
    controller: {
      fees: { payer: "account" },
      losses: { payments: "application" },
      stripe_dashboard: { type: "none" },
    },
    metadata: { user_id: userId, app: "kaia" },
  });
  return account.id;
}
