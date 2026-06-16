import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  prenom: z.string().trim().min(1).max(50),
  locale: z.string().default("fr"),
  objectif: z.string().min(1),
  cycle_knowledge: z.string().min(1),
  sensibilites: z.array(z.string()).default([]),
  notifications_preference: z.string().default("soir"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const d = parsed.data;

    // Upsert onboarding answers
    const { error: answErr } = await supabase
      .from("onboarding_answers")
      .upsert({
        user_id: user.id,
        prenom: d.prenom,
        locale: d.locale,
        objectif: d.objectif,
        cycle_knowledge: d.cycle_knowledge,
        sensibilites: d.sensibilites,
        notifications_preference: d.notifications_preference,
      }, { onConflict: "user_id" });

    if (answErr) {
      return NextResponse.json({ error: "Sauvegarde impossible. Réessaie." }, { status: 500 });
    }

    // Update profile: display_name, locale, onboarding_completed
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        display_name: d.prenom,
        locale: d.locale,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profErr) {
      return NextResponse.json({ error: "Mise à jour du profil impossible." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
