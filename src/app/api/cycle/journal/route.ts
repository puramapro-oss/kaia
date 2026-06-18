import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptCycleNote } from "@/lib/crypto/cycle-encrypt";

const schema = z.object({
  mood: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  symptoms: z.array(z.string()),
  flowIntensity: z.number().min(0).max(4).optional().nullable(),
  notes: z.string().optional(),
  date: z.string().optional(),
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

    const { mood, energy, symptoms, flowIntensity, notes, date } = parsed.data;

    // Encrypt notes if provided
    let encryptedNotes = null;
    if (notes) {
      encryptedNotes = encryptCycleNote(notes);
    }

    // Insert journal entry
    const { data: entry, error: insertError } = await supabase
      .from("cycle_journal")
      .insert({
        user_id: user.id,
        date: date || new Date().toISOString().split("T")[0],
        mood,
        energy,
        symptoms,
        flow_intensity: flowIntensity,
        notes: encryptedNotes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Journal insert error:", insertError);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }

    // Generate LUNA insight (simple example, could call /api/luna/chat)
    const lunaInsight = generateLunaInsight(mood, energy, symptoms);

    return NextResponse.json({ success: true, id: entry.id, lunaInsight });
  } catch (err) {
    console.error("Cycle journal error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function generateLunaInsight(mood: number, energy: number, symptoms: string[]): string {
  if (mood <= 2 && energy <= 2) {
    return "Ton corps te demande du repos. Offre-toi de la douceur aujourd'hui : une tisane, un bain chaud, un moment de silence. Tu as le droit de ralentir.";
  }
  if (symptoms.includes("Crampes") || symptoms.includes("Douleur dos")) {
    return "La chaleur (bouillotte, bain) et le magnésium peuvent vraiment t'aider. Écoute ton corps, il sait ce dont il a besoin.";
  }
  if (mood >= 4 && energy >= 4) {
    return "Quelle belle énergie ! Profite de ce jour pour avancer sur ce qui te tient à cœur. Ton corps est aligné.";
  }
  return "Continue d'écouter tes besoins. Chaque jour est une information précieuse sur ton cycle unique.";
}
