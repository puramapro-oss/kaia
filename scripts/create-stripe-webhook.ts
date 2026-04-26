#!/usr/bin/env -S npx tsx
/**
 * Idempotent: creates the production Stripe webhook endpoint pointing at
 * https://kaia.purama.dev/api/stripe/webhook and prints `whsec_…` to add
 * to STRIPE_WEBHOOK_SECRET in .env.local + Vercel env vars.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY.");

const stripe = new Stripe(STRIPE_SECRET_KEY);

const URL = "https://kaia.purama.dev/api/stripe/webhook";
const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "charge.refunded",
];

async function main() {
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = list.data.find((w) => w.url === URL);
  if (existing) {
    console.log(`✓ Webhook already exists: ${existing.id}`);
    console.log(`  secret: kept (Stripe does not re-disclose it after creation).`);
    return;
  }
  const endpoint = await stripe.webhookEndpoints.create({
    url: URL,
    enabled_events: EVENTS,
    description: "KAÏA — production webhook (kaia.purama.dev)",
    metadata: { app_slug: "kaia" },
  });
  console.log(`✓ Webhook created: ${endpoint.id}`);
  console.log(`  Secret (add to STRIPE_WEBHOOK_SECRET):`);
  console.log(`    ${endpoint.secret}`);
}

main().catch((err) => {
  console.error("✗ Webhook setup failed:", err);
  process.exit(1);
});
