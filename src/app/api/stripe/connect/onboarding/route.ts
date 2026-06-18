import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Onboarding Stripe Connect Express (Embedded Components).
 *
 * DÉFÉRÉ (pending deploy + dep `@stripe/react-connect-js`) : à l'activation,
 * créer le compte Connect (`createConnectAccount`) + une AccountSession
 * (`createConnectAccountSession`) et renvoyer le `clientSecret` pour monter
 * `<ConnectAccountOnboarding>`. Pour l'instant, message d'indisponibilité propre.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (process.env.ENABLE_CONNECT_ONBOARDING !== "true") {
      return NextResponse.json({
        ok: false,
        deferred: true,
        message: "La configuration des paiements ouvrira très bientôt.",
      });
    }

    // TODO(deploy): createConnectAccount + createConnectAccountSession → clientSecret
    // pour monter <ConnectAccountOnboarding> (dep @stripe/react-connect-js).
    return NextResponse.json({ ok: true, action: "pending_implementation" });
  } catch (err) {
    console.error("[stripe/connect/onboarding] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
