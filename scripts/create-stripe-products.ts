#!/usr/bin/env -S npx tsx
/**
 * Idempotent script: creates KAÏA Stripe products + prices + coupons.
 * Skips creation if a product with the same lookup_key/coupon id already exists.
 *
 * Usage:
 *   npm run stripe:setup-products
 *
 * Reads STRIPE_SECRET_KEY from .env.local. Prints the price ids to be added
 * to STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PRODUCT = {
  name: "KAÏA Premium",
  description:
    "Routine multisensorielle complète : 80 pratiques, fonds nature 4K, voix multilingues, rituels collectifs, parrainage 50 % à vie.",
  metadata: { app_slug: "kaia" },
} satisfies Stripe.ProductCreateParams;

const PRICES: Array<{
  lookup_key: string;
  unit_amount: number;
  interval: "month" | "year";
  nickname: string;
}> = [
  { lookup_key: "kaia_standard_monthly", unit_amount: 1499, interval: "month", nickname: "Mensuel" },
  { lookup_key: "kaia_standard_yearly", unit_amount: 12591, interval: "year", nickname: "Annuel −30 %" },
];

const COUPONS: Stripe.CouponCreateParams[] = [
  {
    id: "INFLUENCER_50OFF",
    name: "Code influenceur — 50 % de réduction",
    percent_off: 50,
    duration: "once",
  },
  {
    id: "LAUNCH10",
    name: "Lancement KAÏA — 10 % de réduction",
    percent_off: 10,
    duration: "repeating",
    duration_in_months: 3,
  },
  {
    id: "ANNUAL30",
    name: "Annuel −30 %",
    percent_off: 30,
    duration: "once",
  },
];

async function getOrCreateProduct(): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: `metadata['app_slug']:'kaia' AND name:'KAÏA Premium'`,
  });
  if (existing.data[0]) return existing.data[0];
  return stripe.products.create(PRODUCT);
}

async function getOrCreatePrice(
  productId: string,
  spec: (typeof PRICES)[number]
): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({ lookup_keys: [spec.lookup_key], limit: 1 });
  if (existing.data[0]) return existing.data[0];
  return stripe.prices.create({
    product: productId,
    unit_amount: spec.unit_amount,
    currency: "eur",
    nickname: spec.nickname,
    lookup_key: spec.lookup_key,
    recurring: { interval: spec.interval },
    metadata: { app_slug: "kaia" },
  });
}

async function getOrCreateCoupon(spec: Stripe.CouponCreateParams): Promise<Stripe.Coupon> {
  try {
    return await stripe.coupons.retrieve(spec.id!);
  } catch {
    return stripe.coupons.create(spec);
  }
}

async function main() {
  console.log("→ Creating KAÏA Stripe product…");
  const product = await getOrCreateProduct();
  console.log(`  product: ${product.id}`);

  for (const spec of PRICES) {
    const price = await getOrCreatePrice(product.id, spec);
    console.log(`  ${spec.lookup_key} → ${price.id}`);
  }

  for (const spec of COUPONS) {
    const coupon = await getOrCreateCoupon(spec);
    console.log(`  coupon ${coupon.id} (${coupon.percent_off}% ${coupon.duration})`);
  }

  console.log("✓ Stripe setup done. Add the price ids to .env.local + Vercel env vars:");
  console.log("    STRIPE_PRICE_MONTHLY=price_...");
  console.log("    STRIPE_PRICE_YEARLY=price_...");
}

main().catch((err) => {
  console.error("✗ Stripe setup failed:", err);
  process.exit(1);
});
