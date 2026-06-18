import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  gameSlug: z.string().min(1).max(100),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { allowed } = await rateLimit(`karma_game:${user.id}`, 50, 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaye dans 1 minute." },
        { status: 429 }
      );
    }

    const json = await request.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const { gameSlug } = parsed.data;

    const serviceClient = createServiceClient();

    const [gameResult, progressResult] = await Promise.all([
      serviceClient
        .from("karma_games")
        .select("slug, tokens_reward, recurrence, active")
        .eq("slug", gameSlug)
        .single(),
      serviceClient
        .from("karma_user_progress")
        .select("completions, last_completed_at, total_tokens")
        .eq("user_id", user.id)
        .eq("game_slug", gameSlug)
        .maybeSingle(),
    ]);

    const game = gameResult.data;
    const progress = progressResult.data;

    if (gameResult.error || !game) {
      return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });
    }

    if (!game.active) {
      return NextResponse.json({ error: "Jeu inactif" }, { status: 400 });
    }

    const now = new Date();
    let canComplete = true;

    if (progress?.last_completed_at && game.recurrence !== "once") {
      const last = new Date(progress.last_completed_at);
      const diff = now.getTime() - last.getTime();

      if (game.recurrence === "daily" && diff < 24 * 3600_000) {
        canComplete = false;
      } else if (game.recurrence === "weekly" && diff < 7 * 24 * 3600_000) {
        canComplete = false;
      } else if (game.recurrence === "monthly" && diff < 30 * 24 * 3600_000) {
        canComplete = false;
      }
    } else if (progress && game.recurrence === "once") {
      canComplete = false;
    }

    if (!canComplete) {
      return NextResponse.json(
        { error: "Jeu déjà complété pour cette période" },
        { status: 409 }
      );
    }

    const newCompletions = (progress?.completions ?? 0) + 1;
    const newTotal = (progress?.total_tokens ?? 0) + game.tokens_reward;

    const { error: upsertError } = await serviceClient
      .from("karma_user_progress")
      .upsert(
        {
          user_id: user.id,
          game_slug: gameSlug,
          completions: newCompletions,
          last_completed_at: now.toISOString(),
          total_tokens: newTotal,
        },
        { onConflict: "user_id,game_slug" }
      );

    if (upsertError) {
      console.error("[karma/complete-game] Upsert error:", upsertError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour des progrès" }, { status: 500 });
    }

    return NextResponse.json(
      {
        earned: true,
        tokensAwarded: game.tokens_reward,
        totalTokens: newTotal,
        completions: newCompletions,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[karma/complete-game] Exception:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
