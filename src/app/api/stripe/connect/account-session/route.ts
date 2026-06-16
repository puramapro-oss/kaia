import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Compte Stripe Connect non configuré." },
        { status: 404 }
      );
    }

    const accountSession = await stripe.accountSessions.create({
      account: profile.stripe_account_id,
      components: {
        payouts: {
          enabled: true,
          features: { instant_payouts: true, standard_payouts: true, edit_payout_schedule: true },
        },
        balances: { enabled: true },
        notification_banner: { enabled: true },
      },
    });

    return NextResponse.json({ client_secret: accountSession.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
