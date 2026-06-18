import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KarmaClient from "./KarmaClient";

export const metadata: Metadata = { title: "KARMA — KAÏA" };

export default async function KarmaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: games }, { data: progress }] = await Promise.all([
    supabase
      .from("karma_games")
      .select("*")
      .eq("active", true)
      .order("category"),
    supabase
      .from("karma_user_progress")
      .select("game_slug, completions, last_completed_at, total_tokens")
      .eq("user_id", user.id),
  ]);

  const totalTokens = progress?.reduce((sum, p) => sum + (p.total_tokens || 0), 0) || 0;

  return <KarmaClient games={games || []} progress={progress || []} totalTokens={totalTokens} />;
}
