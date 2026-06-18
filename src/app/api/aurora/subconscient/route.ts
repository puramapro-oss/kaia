import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ConsentSchema = z.object({
  action: z.literal("consent"),
  triggered_by_user: z.literal(true),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = ConsentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { error } = await supabase
    .from("subconscient_consents")
    .upsert(
      {
        user_id: user.id,
        triggered_by_user: true,
        consented_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Impossible d'enregistrer le consentement" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const { data } = await supabase
    .from("subconscient_consents")
    .select("consented_at, triggered_by_user")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ hasConsented: !!data, consent: data ?? null });
}
