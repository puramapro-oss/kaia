import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { stripe, getPlan } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { TRIAL_DAYS } from "@/lib/constants";

const Body = z.object({
  plan: z.enum(["monthly", "yearly"]),
  influencerLinkId: z.string().uuid().optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Tu dois être connecté·e pour t'abonner." },
      { status: 401 }
    );
  }

  const plan = getPlan(parsed.data.plan);
  if (!plan.envPriceId) {
    return NextResponse.json(
      {
        error:
          "Plan non encore disponible. Lance `npm run stripe:setup-products` puis ajoute STRIPE_PRICE_* dans Vercel.",
      },
      { status: 503 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const origin =
    request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://kaia.purama.dev";

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: user.id, app_slug: "kaia" },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: plan.envPriceId, quantity: 1 }],
      payment_method_types: ["card", "paypal", "link"],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          user_id: user.id,
          app_slug: "kaia",
          influencer_link_id: parsed.data.influencerLinkId ?? "",
          referral_code: parsed.data.referralCode ?? "",
        },
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        app_slug: "kaia",
        influencer_link_id: parsed.data.influencerLinkId ?? "",
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe indisponible.";
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement.", details: message },
      { status: 502 }
    );
  }
}
