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
      priceId: string;
      priceLabel: string;
    }> = [];

    for (const plan of VITAE_PLANS) {
      const product = await stripe.products.create({
        name: `KAÏA VITAE — ${plan.key.charAt(0).toUpperCase() + plan.key.slice(1)}`,
        description: plan.description,
        metadata: { app: "kaia", plan_key: plan.key, multiplier: String(plan.multiplier) },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceCents,
        currency: "eur",
        recurring: { interval: "month" },
        metadata: { app: "kaia", plan_key: plan.key },
      });

      results.push({
        key: plan.key,
        productId: product.id,
        priceId: price.id,
        priceLabel: plan.priceLabel,
      });
    }

    const envLines = results
      .map((r) => {
        const envKey = `STRIPE_PRICE_${r.key.toUpperCase()}=${r.priceId}`;
        return envKey;
      })
      .join("\n");

    return NextResponse.json({
      success: true,
      message: "VITAE products created. Add these to .env.local and Vercel:",
      envVars: envLines,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
