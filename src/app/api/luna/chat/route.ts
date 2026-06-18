import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLunaModeConfig, LunaMode } from "@/lib/luna/modes";
import { detectCrisis, getCrisisResponse, passLocalFilter } from "@/lib/luna/safety";
import Anthropic from "@anthropic-ai/sdk";

const schema = z.object({
  message: z.string().min(1),
  mode: z.enum([
    "cycle_analysis",
    "daily_recommendation",
    "aurora_guidance",
    "faq",
    "caregiver_support",
    "core_orchestration",
    "general",
  ] as const).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
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

    // Rate limit check (simple counter, 20 req / 5 min)
    const { count } = await supabase
      .from("luna_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 20) {
      return NextResponse.json(
        { error: "Trop de requêtes. Attends quelques minutes avant de réessayer." },
        { status: 429 }
      );
    }

    // Log request for rate limit
    await supabase.from("luna_rate_limit").insert({ user_id: user.id });

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { message, mode = "general", history = [] } = parsed.data;

    // Crisis detection
    if (detectCrisis(message)) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const response = getCrisisResponse();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: response })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Get mode config
    const config = getLunaModeConfig(mode as LunaMode);

    // Build messages
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Anthropic streaming
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const modelMap = {
      main: "claude-sonnet-4-6" as const,
      fast: "claude-haiku-4-5-20251001" as const,
      pro: "claude-opus-4-7" as const,
    };

    const stream = await anthropic.messages.stream({
      model: modelMap[config.model],
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";

          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const content = chunk.delta.text;
              fullResponse += content;

              // Pass local filter on each chunk
              if (passLocalFilter(content)) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              } else {
                // Blocked by filter
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      content: "[Réponse filtrée pour sécurité — je ne peux pas donner de conseil médical]",
                    })}\n\n`
                  )
                );
                break;
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("LUNA stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("LUNA chat error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
