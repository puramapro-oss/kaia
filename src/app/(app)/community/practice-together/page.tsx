import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupCard, type PracticeGroupCard } from "@/components/community/GroupCard";
import { formatScheduleFr } from "@/lib/community/cron-readable";

export const metadata = {
  title: "Salles de pratique — KAÏA",
  description: "Pratiquez ensemble en visio.",
};

export const dynamic = "force-dynamic";

export default async function PracticeTogetherPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community/practice-together");

  const { data: groups } = await supabase
    .from("practice_groups")
    .select("id, slug, name, description, capacity, meet_url, schedule_cron")
    .eq("active", true)
    .order("name");

  const groupIds = (groups ?? []).map((g) => g.id);

  // Counters via head:true (compte sans charger les rows)
  const counters: Record<string, number> = {};
  if (groupIds.length > 0) {
    const promises = groupIds.map(async (id) => {
      const { count } = await supabase
        .from("group_memberships")
        .select("group_id", { count: "exact", head: true })
        .eq("group_id", id);
      return [id, count ?? 0] as const;
    });
    const results = await Promise.all(promises);
    for (const [id, c] of results) counters[id] = c;
  }

  // Mes adhésions
  const { data: myMemberships } = await supabase
    .from("group_memberships")
    .select("group_id")
    .eq("user_id", user.id);
  const myGroups = new Set((myMemberships ?? []).map((m) => m.group_id));

  const cards: PracticeGroupCard[] = (groups ?? []).map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    description: g.description ?? "",
    capacity: g.capacity ?? 12,
    membersCount: counters[g.id] ?? 0,
    meetUrl: g.meet_url ?? "",
    scheduleHuman: g.schedule_cron ? formatScheduleFr(g.schedule_cron) : "À définir",
    isMember: myGroups.has(g.id),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white wellness-anim"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
        Retour à la communauté
      </Link>

      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          <Sparkles className="h-3 w-3" strokeWidth={2} />
          Pratique partagée
        </span>
        <h1 className="font-display text-3xl text-white tracking-tight">
          Pratiquons ensemble
        </h1>
        <p className="text-sm text-white/55 leading-relaxed">
          Salles en visio sur Jitsi (gratuit, anonyme). Caméra optionnelle, présence simple, silence partagé.
        </p>
      </header>

      {cards.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center space-y-2">
          <p className="text-white/70 text-sm">
            Aucune salle disponible pour l'instant.
          </p>
          <p className="text-white/40 text-xs">Reviens plus tard.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
