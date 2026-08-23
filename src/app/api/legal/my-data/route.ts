/**
 * GET /api/legal/my-data — export générique du socle légal (preuve d'acceptation + consentement
 * cookies). L'export complet des données personnelles de KAÏA (profil, cycles déchiffrés,
 * karma, parrainage) est déjà servi par `/api/rgpd/export` (implémentation existante, gère le
 * déchiffrement AES-256 des notes de cycle) — la page « Ma mémoire » pointe vers cette route-là.
 * Cette route reste conforme au socle NIYAMA pour toute app consommant le paquet générique.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const [{ data: profile }, { data: acceptances }, { data: cookieConsent }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("legal_acceptances").select("doc_type, version, accepted_at").eq("user_id", user.id),
    supabase.from("cookie_consents").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    compte: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    acceptationsLegales: acceptances ?? [],
    consentementCookies: cookieConsent ?? null,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="mes-donnees.json"',
    },
  });
}
