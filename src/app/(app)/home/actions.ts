"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PulseSchema = z.object({
  stress: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
});

export async function savePulse(values: z.infer<typeof PulseSchema>) {
  const parsed = PulseSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const today = new Date().toISOString().slice(0, 10);

  // Upsert sur (user_id, routine_date) — déjà UNIQUE en DB.
  const { error } = await supabase
    .from("daily_routines")
    .upsert(
      {
        user_id: user.id,
        routine_date: today,
        pulse_stress: parsed.data.stress,
        pulse_energy: parsed.data.energy,
        pulse_mood: parsed.data.mood,
      },
      { onConflict: "user_id,routine_date" },
    );

  if (error) return { ok: false as const };

  revalidatePath("/home");
  return { ok: true as const };
}
