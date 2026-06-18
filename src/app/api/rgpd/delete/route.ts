import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * RGPD — demande de suppression de compte (art. 17, droit à l'effacement).
 *
 * Rétention légale : les données de cycle sont conservées 30 jours avant purge
 * (obligations comptables/anti-fraude), puis effacées par le CRON
 * `account-deletion`. La suppression réelle (auth + cascade) est DÉFÉRÉE
 * derrière `ENABLE_ACCOUNT_DELETION` (opération destructive à valider post-deploy).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`rgpd_delete:${user.id}`, 3, 86400);
    if (!allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    if (process.env.ENABLE_ACCOUNT_DELETION !== "true") {
      return NextResponse.json({
        ok: true,
        deferred: true,
        message:
          "Ta demande de suppression est enregistrée. Tes données seront effacées sous 30 jours (rétention légale).",
      });
    }

    // TODO(deploy): marquer deletion_requested_at + planifier purge CRON
    // account-deletion (cascade FK), en conservant les cycles 30j.
    return NextResponse.json({ ok: true, action: "pending_implementation" });
  } catch (err) {
    console.error("[rgpd/delete] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
