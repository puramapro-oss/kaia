/**
 * POST /api/shop/purchase
 *  - Body: { productId: uuid }
 *  - Auth requise
 *  - Crée une session Stripe Checkout mode='payment'
 *  - Insère un row purchases en pending (idempotency par stripe_session_id à la confirmation webhook)
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  productId: z.string().uuid(),
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Tu dois être connecté·e pour acheter." },
      { status: 401 }
    );
  }

  const limited = await rateLimit(`shop-purchase:${user.id}`, 10, 300);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives — patiente quelques minutes." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();

  const { data: product } = await admin
    .from("products")
    .select("id, slug, title, description, price_cents, kind, active")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!product || !product.active) {
    return NextResponse.json({ error: "Produit indisponible." }, { status: 404 });
  }

  const { data: purchase, error: insErr } = await admin
    .from("purchases")
    .insert({
      user_id: user.id,
      product_id: product.id,
      amount_cents: product.price_cents,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !purchase) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'achat.", details: insErr?.message },
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
            unit_amount: product.price_cents as number,
            product_data: {
              name: product.title as string,
              description: (product.description as string) ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kaia_purchase_id: purchase.id,
        kaia_product_slug: product.slug as string,
        user_id: user.id,
        app_slug: "kaia",
      },
      payment_intent_data: {
        metadata: {
          kaia_purchase_id: purchase.id,
          user_id: user.id,
          app_slug: "kaia",
        },
      },
      success_url: `${origin}/shop?status=success`,
      cancel_url: `${origin}/shop/${product.slug}?status=cancel`,
    });

    return NextResponse.json({ url: session.url, purchaseId: purchase.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe indisponible.";
    await admin.from("purchases").update({ status: "refunded" }).eq("id", purchase.id);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement.", details: message },
      { status: 502 }
    );
  }
}
