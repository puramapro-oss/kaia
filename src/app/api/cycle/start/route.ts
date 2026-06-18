import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCycleDay } from "@/lib/cycle/phases";

const schema = z.object({
  startDate: z.string(),
  cycleDuration: z.number().min(20).max(35).optional(),
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

    const { startDate, cycleDuration = 28 } = parsed.data;

    // Upsert profile
    const { error: upsertError } = await supabase
      .from("profiles")
      .update({
        cycle_start_date: startDate,
        cycle_duration: cycleDuration,
      })
      .eq("id", user.id);

    if (upsertError) {
      console.error("Cycle start upsert error:", upsertError);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }

    const cycleDay = getCycleDay(new Date(startDate));

    return NextResponse.json({ success: true, cycleDay });
  } catch (err) {
    console.error("Cycle start error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
