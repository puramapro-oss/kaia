import { createServiceClient } from "@/lib/supabase/admin";
import { MissionReviewActions } from "@/components/admin/MissionReviewActions";

export const dynamic = "force-dynamic";

interface CompletionRow {
  id: string;
  mission_id: string;
  user_id: string;
  proof_url: string | null;
  status: string;
  created_at: string;
  missions: { title: string; reward_tokens: number; kind: string } | null;
  profiles: { email: string; full_name: string | null } | null;
}

export default async function AdminMissionsPage() {
  const admin = createServiceClient();

  const { data } = await admin
    .from("mission_completions")
    .select(`
      id, mission_id, user_id, proof_url, status, created_at,
      missions:mission_id (title, reward_tokens, kind),
      profiles:user_id (email, full_name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  const list = (data ?? []) as unknown as CompletionRow[];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Missions à valider ({list.length})</h1>
      {list.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          Aucune mission en attente. Tout est à jour ✨
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="font-medium">{c.missions?.title ?? "Mission inconnue"}</h2>
                  <p className="text-xs text-white/60">
                    {c.profiles?.email} ·{" "}
                    {new Date(c.created_at).toLocaleString("fr-FR")} ·{" "}
                    <span className="text-emerald-300">+{c.missions?.reward_tokens ?? 0} tokens</span>
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-300/15 text-amber-200">
                  {c.missions?.kind}
                </span>
              </div>
              {c.proof_url && (
                <a
                  href={c.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-300 hover:underline break-all block mb-3"
                >
                  Preuve : {c.proof_url}
                </a>
              )}
              <MissionReviewActions completionId={c.id} rewardTokens={c.missions?.reward_tokens ?? 0} userId={c.user_id} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
