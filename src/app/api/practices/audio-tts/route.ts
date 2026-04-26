import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Endpoint TTS — désactivé en P3.
 * Quand `ELEVENLABS_API_KEY` sera présent (P9), on switche le flag à `true`
 * et on implémente la génération + cache R2/Vercel Blob.
 *
 * En attendant, le client utilise `window.speechSynthesis` (navigateur natif,
 * gratuit, sans réseau) — voir `components/routine/SessionPlayer.tsx`.
 */
const ELEVENLABS_ENABLED =
  process.env.ENABLE_ELEVENLABS === "true" && Boolean(process.env.ELEVENLABS_API_KEY);

const Body = z.object({
  text: z.string().min(1).max(2000),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  voiceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!ELEVENLABS_ENABLED) {
    return NextResponse.json(
      {
        error: "TTS serveur désactivé en P3.",
        fallback: "client_speech_synthesis",
        message:
          "Utilise window.speechSynthesis côté client. Activation ElevenLabs prévue en P9 (flag ENABLE_ELEVENLABS).",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const rl = await rateLimit(`tts:${user.id}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de requêtes TTS." }, { status: 429 });
  }

  // P9 : implémentation ElevenLabs ici (cache hash → Vercel Blob → URL signée).
  return NextResponse.json(
    { error: "Implémentation ElevenLabs prévue en P9." },
    { status: 501 },
  );
}
