import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { remainingBudget } from "@/lib/ads/rules";

export const metadata: Metadata = { title: "Mes annonces — KAÏA" };

const STATUS_LABEL: Record<string, string> = {
  pending: "En validation",
  approved: "En ligne",
  rejected: "Refusée",
};

export default async function MyAdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ads } = await supabase
    .from("user_ads")
    .select("id, title, placement, moderation_status, active, budget_tokens, spent_tokens, served_count, click_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = ads ?? [];

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text">Mes annonces</h1>
        <Link
          href="/ads/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium gradient-kaia text-[var(--background)]"
        >
          <Plus className="w-4 h-4" /> Créer
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Megaphone className="w-8 h-8 text-[var(--kaia-moon)] mx-auto mb-3" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Aucune annonce pour le moment. Lance ta première campagne avec tes tokens.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id as string} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{a.title}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--kaia-soft)] text-[var(--foreground-muted)]">
                  {STATUS_LABEL[a.moderation_status as string] ?? a.moderation_status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--foreground-muted)]">
                <span>{a.placement === "home" ? "Accueil" : "Fil"}</span>
                <span>{a.served_count ?? 0} vues</span>
                <span>{a.click_count ?? 0} clics</span>
                <span>
                  {remainingBudget({ budget_tokens: a.budget_tokens as number, spent_tokens: a.spent_tokens as number })} /
                  {a.budget_tokens as number} tokens restants
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
