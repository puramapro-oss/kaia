import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { stripe, getVitaePlan } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { TRIAL_DAYS, VITAE_PLAN_KEYS } from "@/lib/constants";
import { readInfluencerCookie } from "@/lib/influencer/cookie";
import { readReferralCookie } from "@/lib/referral/cookie";

const Body = z.object({
  plan: z.enum([
    VITAE_PLAN_KEYS.ESSENTIEL,
    VITAE_PLAN_KEYS.INFINI,
    VITAE_PLAN_KEYS.LEGENDE,
  ]),
  billing: z.enum(["monthly", "annual"]).default("monthly"),
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

  const plan = getVitaePlan(parsed.data.plan);
  if (!plan) {
    return NextResponse.json({ error: `Plan inconnu: ${parsed.data.plan}` }, { status: 400 });
  }
  const billing = parsed.data.billing;
  const priceId = billing === "annual" ? plan.envPriceIdAnnual : plan.envPriceId;
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Plan non encore disponible. Lance `npm run stripe:setup-products` puis ajoute STRIPE_PRICE_* dans .env.local.",
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

  const cookieStore = await cookies();
  const fromInfCookie = readInfluencerCookie(cookieStore);
  const fromRefCookie = readReferralCookie(cookieStore);
  const influencerLinkId =
    parsed.data.influencerLinkId ?? fromInfCookie?.linkId ?? "";
  const referralCode = parsed.data.referralCode ?? fromRefCookie?.code ?? "";

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

  const checkoutParams: import("stripe").Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card", "link"],
    subscription_data: {
      trial_period_days: plan.trialDays ?? TRIAL_DAYS,
      metadata: {
        user_id: user.id,
        app_slug: "kaia",
        plan_key: plan.key,
        billing,
        influencer_link_id: influencerLinkId,
        referral_code: referralCode,
      },
    },
    success_url: `${origin}/accueil?checkout=success&plan=${plan.key}&billing=${billing}`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      app_slug: "kaia",
      plan_key: plan.key,
      billing,
      influencer_link_id: influencerLinkId,
      referral_code: referralCode,
    },
    allow_promotion_codes: true,
  };

  try {
    const session = await stripe.checkout.sessions.create(checkoutParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe indisponible.";
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement.", details: message },
      { status: 502 }
    );
  }
}
