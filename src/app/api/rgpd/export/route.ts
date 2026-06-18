import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { decryptCycleNote } from "@/lib/crypto/cycle-encrypt";

export const runtime = "nodejs";

/**
 * RGPD — export des données personnelles (art. 20, portabilité). Renvoie un
 * JSON téléchargeable. Les notes de cycle chiffrées (AES-256) sont déchiffrées
 * pour l'export, qui appartient à l'utilisatrice.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`rgpd_export:${user.id}`, 3, 86400);
    if (!allowed) {
      return NextResponse.json({ error: "Limite atteinte (3 exports/jour)." }, { status: 429 });
    }

    const service = createServiceClient();
    const [{ data: profile }, { data: cycles }, { data: journal }, { data: shares }, { data: commissions }] =
      await Promise.all([
        service.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        service.from("cycles").select("*").eq("user_id", user.id),
        service.from("cycle_journal").select("*").eq("user_id", user.id),
        service.from("karma_user_shares").select("*").eq("user_id", user.id),
        service.from("referral_commissions").select("*").eq("referrer_user_id", user.id),
      ]);

    const decryptNotes = <T extends { notes_encrypted?: string | null }>(rows: T[] | null) =>
      (rows ?? []).map(({ notes_encrypted, ...rest }) => ({
        ...rest,
        notes: notes_encrypted ? decryptCycleNote(notes_encrypted) : null,
      }));

    const payload = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      profile,
      cycles: decryptNotes(cycles),
      journal: decryptNotes(journal),
      karmaShares: shares ?? [],
      referralCommissions: commissions ?? [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="kaia-export-${user.id}.json"`,
      },
    });
  } catch (err) {
    console.error("[rgpd/export] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
