import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { VITAE_PLANS } from "@/lib/stripe";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: Array<{
      key: string;
      productId: string;
      priceMonthlyId: string;
      priceAnnualId: string;
      priceLabel: string;
    }> = [];

    for (const plan of VITAE_PLANS) {
      const product = await stripe.products.create({
        name: `KAÏA VITAE — ${plan.key.charAt(0).toUpperCase() + plan.key.slice(1)}`,
        description: plan.description,
        metadata: { app: "kaia", plan_key: plan.key, multiplier: String(plan.multiplier) },
      });

      const priceMonthly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceCents,
        currency: "eur",
        recurring: { interval: "month" },
        metadata: { app: "kaia", plan_key: plan.key, billing: "monthly" },
      });

      // Annual = monthly × 12 × 0.7 (−30%)
      const priceAnnual = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.priceCents * 12 * 0.7),
        currency: "eur",
        recurring: { interval: "year" },
        metadata: { app: "kaia", plan_key: plan.key, billing: "annual" },
      });

      results.push({
        key: plan.key,
        productId: product.id,
        priceMonthlyId: priceMonthly.id,
        priceAnnualId: priceAnnual.id,
        priceLabel: plan.priceLabel,
      });
    }

    // Create coupons
    const coupons = await Promise.allSettled([
      stripe.coupons.create({
        id: "INFLUENCER_50OFF",
        percent_off: 50,
        duration: "once",
        name: "Influenceur −50% premier mois",
        metadata: { app: "kaia" },
      }),
      stripe.coupons.create({
        id: "LAUNCH10",
        percent_off: 10,
        duration: "once",
        name: "Lancement −10%",
        metadata: { app: "kaia" },
      }),
      stripe.coupons.create({
        id: "ANNUAL30",
        percent_off: 30,
        duration: "once",
        name: "Annuel −30%",
        metadata: { app: "kaia" },
      }),
    ]);

    const envLines = results
      .flatMap((r) => [
        `STRIPE_PRICE_${r.key.toUpperCase()}=${r.priceMonthlyId}`,
        `STRIPE_PRICE_${r.key.toUpperCase()}_ANNUAL=${r.priceAnnualId}`,
      ])
      .join("\n");

    return NextResponse.json({
      success: true,
      message: "VITAE products + annual prices + coupons created. Add these to .env.local and Vercel:",
      envVars: envLines,
      results,
      coupons: coupons.map((c, i) =>
        c.status === "fulfilled"
          ? { id: ["INFLUENCER_50OFF", "LAUNCH10", "ANNUAL30"][i], status: "created" }
          : { id: ["INFLUENCER_50OFF", "LAUNCH10", "ANNUAL30"][i], status: "already_exists" }
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
