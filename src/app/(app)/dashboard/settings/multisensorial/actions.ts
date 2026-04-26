"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PrefSchema = z.object({
  background_video: z.boolean().optional(),
  haptics: z.boolean().optional(),
  binaural: z.boolean().optional(),
  cinematic: z.boolean().optional(),
});

export type UpdateMultisensorialResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateMultisensorialPrefs(
  patch: z.infer<typeof PrefSchema>
): Promise<UpdateMultisensorialResult> {
  const parsed = PrefSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: "Format invalide. Recharge la page et réessaie." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée. Reconnecte-toi pour enregistrer." };
  }

  const update: Record<string, boolean> = {};
  if (parsed.data.background_video !== undefined)
    update.multisensorial_background_video = parsed.data.background_video;
  if (parsed.data.haptics !== undefined)
    update.multisensorial_haptics = parsed.data.haptics;
  if (parsed.data.binaural !== undefined)
    update.multisensorial_binaural = parsed.data.binaural;
  if (parsed.data.cinematic !== undefined)
    update.multisensorial_cinematic = parsed.data.cinematic;

  if (Object.keys(update).length === 0) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      error:
        "Impossible d'enregistrer pour le moment. Vérifie ta connexion puis réessaie.",
    };
  }

  revalidatePath("/dashboard/settings/multisensorial");
  revalidatePath("/dashboard");
  return { ok: true };
}
