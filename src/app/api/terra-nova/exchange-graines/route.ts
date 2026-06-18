import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Conversion / retrait de Graines. KYC OBLIGATOIRE (Stripe Identity).
 *
 * DÉFÉRÉ (pending deploy + secrets) : la création réelle du lien Stripe Identity
 * et le transfert sont branchés après réactivation Vercel. Tant que
 * `ENABLE_GRAINES_EXCHANGE !== "true"`, on renvoie un message d'indisponibilité
 * propre — jamais d'écran blanc.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`graines_exchange:${user.id}`, 10, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const service = createServiceClient();
    const { data: wallet } = await service
      .from("graines_wallet")
      .select("kyc_completed_at, balance_graines")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wallet?.kyc_completed_at) {
      // Identité déjà vérifiée → la conversion réelle sera activée au déploiement.
      return NextResponse.json({
        ok: false,
        kycCompleted: true,
        message: "La conversion de Graines sera disponible très bientôt.",
      });
    }

    // Pas encore KYC : on signale le besoin de vérification.
    // TODO(deploy): générer un VerificationSession Stripe Identity et renvoyer kycUrl.
    return NextResponse.json({
      ok: false,
      needsKyc: true,
      message: "La vérification d'identité sera disponible très bientôt.",
    });
  } catch (err) {
    console.error("[terra-nova/exchange-graines] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
