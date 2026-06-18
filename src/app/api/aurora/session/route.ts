import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AuroraVariant } from "@/lib/aurora/protocols";

const schema = z.object({
  variant: z.enum(["calm", "focus", "sleep", "ignite"]),
  phasesCompleted: z.number().min(1).max(5),
  durationSec: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { variant, phasesCompleted, durationSec } = parsed.data;

    // Insert session
    const { data: session, error: insertError } = await supabase
      .from("aurora_sessions")
      .insert({
        user_id: user.id,
        variant,
        phases_completed: phasesCompleted,
        duration_sec: durationSec,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("AURORA session insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }

    // Award KARMA (5 tokens per session)
    const karmaEarned = 5;
    await supabase.rpc("increment_karma", { user_id: user.id, amount: karmaEarned });

    return NextResponse.json({ success: true, id: session.id, karmaEarned });
  } catch (err) {
    console.error("AURORA session error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
