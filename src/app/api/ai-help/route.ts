/**
 * POST /api/ai-help
 *  - Body : { threadId?: uuid, message: string }
 *  - Crée un thread si absent
 *  - Pass safety classifier d'abord
 *  - Si distress → renvoie message bienveillant + sosOpen=true (pas d'appel Claude)
 *  - Sinon → askClaude streaming désactivé (réponse JSON simple en P8)
 *  - Stocke user + assistant messages
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { askClaude } from "@/lib/claude";
import { rateLimit } from "@/lib/rate-limit";
import { quickLocalCheck, deepClassify } from "@/lib/safety/classifier";
import { buildAiHelpSystem } from "@/lib/agent/prompts/ai-help";

const Body = z.object({
  threadId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  locale: z.enum(["fr", "en", "es", "ar", "zh"]).default("fr"),
});

export const runtime = "nodejs";
export const maxDuration = 30;

const SOS_RESPONSE_FR =
  "Je t'entends. Ce que tu ressens compte. Je ne suis pas la bonne personne pour ce moment précis — mais des humains formés sont là pour toi, gratuit et anonyme, 24h/24 :\n\n• 3114 (numéro national de prévention du suicide, FR)\n• 112 (urgence européenne)\n• SOS Amitié : 09 72 39 40 50\n\nVa sur /sos pour le détail. Je reste là après aussi, prends soin de toi 💚";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Auth requise." }, { status: 401 });
  }

  const limited = await rateLimit(`ai-help:${user.id}`, 30, 300);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Trop de messages — patiente quelques minutes." },
      { status: 429 }
    );
  }

  const admin = createServiceClient();

  // Trouve ou crée le thread
  let threadId = parsed.data.threadId;
  if (!threadId) {
    const { data: t } = await admin
      .from("ai_help_threads")
      .insert({ user_id: user.id, title: parsed.data.message.slice(0, 60) })
      .select("id")
      .single();
    threadId = t?.id as string | undefined;
  }
  if (!threadId) {
    return NextResponse.json({ error: "Impossible de créer le thread." }, { status: 500 });
  }

  // Stocke user message
  await admin.from("ai_help_messages").insert({
    thread_id: threadId,
    user_id: user.id,
    role: "user",
    content: parsed.data.message,
  });

  // Classification safety
  const localCheck = quickLocalCheck(parsed.data.message);
  let safety = localCheck;
  if (localCheck.category !== "distress_high" && localCheck.category !== "abuse") {
    // call deep classifier (haiku) — best-effort
    try {
      safety = await deepClassify(parsed.data.message);
    } catch {
      safety = localCheck;
    }
  }

  // Si distress / abuse → réponse SOS scriptée + flag thread
  if (safety.suggestSos) {
    await admin.from("ai_help_messages").insert({
      thread_id: threadId,
      user_id: user.id,
      role: "assistant",
      content: SOS_RESPONSE_FR,
      safety_flags: [safety.category],
    });
    await admin
      .from("ai_help_threads")
      .update({ distress_flag: true })
      .eq("id", threadId);
    return NextResponse.json({
      threadId,
      reply: SOS_RESPONSE_FR,
      sosOpen: true,
      safety: { category: safety.category, confidence: safety.confidence },
    });
  }

  // Sinon : Claude
  let reply = "";
  try {
    reply = await askClaude(parsed.data.message, {
      model: "main",
      systemPrompt: buildAiHelpSystem(parsed.data.locale),
      maxTokens: 800,
    });
  } catch (err) {
    console.error("[ai-help]", err);
    reply =
      "Je rencontre un souci technique pour te répondre là, désolé·e. Réessaye dans quelques secondes 🙏";
  }

  // Filtre claims médicaux dans la réponse Claude
  const blocklist = ["soigner", "guérir", "traiter ta", "diagnostiquer"];
  const lower = reply.toLowerCase();
  if (blocklist.some((w) => lower.includes(w))) {
    reply = `Je préfère ne pas répondre côté médical — je ne suis pas formé·e pour ça. Pour cette question précise, parle à un·e professionnel·le de santé. Je peux t'aider sur le bien-être au quotidien, l'app KAÏA, ou la routine si tu veux 💚`;
  }

  await admin.from("ai_help_messages").insert({
    thread_id: threadId,
    user_id: user.id,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({
    threadId,
    reply,
    sosOpen: false,
    safety: { category: safety.category, confidence: safety.confidence },
  });
}
