/**
 * POST /api/donations/create
 *  - Body: { causeSlug: string, amountCents: int (>=100), donorName?: string }
 *  - Crée une session Stripe Checkout mode='payment' (one-shot)
 *  - Insère un row donations en status='pending' (idempotency par stripe_payment_intent à la confirmation webhook)
 *  - Auth requise
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCause } from "@/lib/donations/causes";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  causeSlug: z.string().min(2).max(40),
  amountCents: z.number().int().min(100).max(500000),
  donorName: z.string().min(1).max(120).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const cause = getCause(parsed.data.causeSlug);
  if (!cause) {
    return NextResponse.json({ error: "Cause inconnue." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Tu dois être connecté·e pour faire un don." },
      { status: 401 }
    );
  }

  const limited = await rateLimit(`donation-create:${user.id}`, 5, 300);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives — patiente quelques minutes." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();

  // Crée le row donations en pending
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const donorName = parsed.data.donorName ?? profile?.full_name ?? "Donateur·rice anonyme";

  const { data: donation, error: insErr } = await admin
    .from("donations")
    .insert({
      user_id: user.id,
      cause: cause.slug,
      amount_cents: parsed.data.amountCents,
      donor_email: user.email ?? null,
      donor_name: donorName,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !donation) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer le don.", details: insErr?.message },
      { status: 500 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://kaia.purama.dev";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "paypal", "link"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: parsed.data.amountCents,
            product_data: {
              name: `Don à ${cause.title}`,
              description: cause.short,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kaia_donation_id: donation.id,
        kaia_cause: cause.slug,
        user_id: user.id,
        app_slug: "kaia",
      },
      payment_intent_data: {
        metadata: {
          kaia_donation_id: donation.id,
          kaia_cause: cause.slug,
          user_id: user.id,
          app_slug: "kaia",
        },
      },
      success_url: `${origin}/donations?status=success`,
      cancel_url: `${origin}/donations?status=cancel`,
    });

    return NextResponse.json({ url: session.url, donationId: donation.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe indisponible.";
    // On marque la donation failed pour ne pas laisser un row orphelin
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement.", details: message },
      { status: 502 }
    );
  }
}
