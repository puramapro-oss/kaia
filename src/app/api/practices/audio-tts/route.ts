import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { SUPPORTED_LOCALES } from "@/lib/constants";
import { getVoice } from "@/lib/audio/voices";

export const runtime = "nodejs";

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
        error: "TTS serveur désactivé.",
        fallback: "client_speech_synthesis",
        message: "Utilise window.speechSynthesis côté client.",
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

  const { text, locale = "fr", voiceId } = parsed.data;
  const voice = getVoice(locale);
  const selectedVoiceId = voiceId ?? voice.voiceId;

  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: voice.stability,
          similarity_boost: voice.similarity,
          style: voice.style,
          use_speaker_boost: voice.speakerBoost,
        },
      }),
    },
  );

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "");
    console.error("[audio-tts] ElevenLabs error:", resp.status, errorText);
    return NextResponse.json({ error: "Génération audio échouée." }, { status: 502 });
  }

  return new NextResponse(resp.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
