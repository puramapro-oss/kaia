import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { quoteWithdrawal, MIN_WITHDRAWAL_CENTS } from "@/lib/wallet/fees";

const Body = z.object({ amountCents: z.number().int().positive() });

export const runtime = "nodejs";

/**
 * Retrait des gains KARMA via Stripe Connect (transfer).
 *
 * DÉFÉRÉ (pending deploy + Connect onboarding réel) : tant que
 * `ENABLE_PAYOUTS !== "true"`, on valide le devis (frais) et on renvoie un
 * message clair sans exécuter de transfert. Aucune écran blanc.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`karma_payout:${user.id}`, 5, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const quote = quoteWithdrawal(parsed.data.amountCents);
    if (!quote) {
      return NextResponse.json(
        { error: `Montant invalide (minimum ${MIN_WITHDRAWAL_CENTS / 100}€).` },
        { status: 400 },
      );
    }

    if (process.env.ENABLE_PAYOUTS !== "true") {
      return NextResponse.json({
        ok: false,
        deferred: true,
        quote,
        message: "Les retraits ouvriront très bientôt. Ton solde est en sécurité.",
      });
    }

    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error("[karma/payout] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
