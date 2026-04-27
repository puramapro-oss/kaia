import { redirect } from "next/navigation";
import { Compass, Sparkles, Users, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { MissionCard } from "@/components/missions/MissionCard";

export const metadata = {
  title: "Missions — KAÏA",
  description: "Gagne des tokens en complétant des missions concrètes.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: string;
}

interface MissionRow {
  id: string;
  slug: string;
  kind: "solo" | "humanitarian" | "marketing" | "collaborative";
  title: string;
  description: string | null;
  reward_tokens: number;
  proof_kind: string;
  max_completions: number | null;
  active: boolean;
}

interface CompletionRow {
  mission_id: string;
  status: "pending" | "approved" | "rejected";
}

const TABS: Array<{ key: MissionRow["kind"]; label: string; icon: typeof Compass }> = [
  { key: "solo", label: "Solo", icon: Sparkles },
  { key: "humanitarian", label: "Humanitaire", icon: Users },
  { key: "marketing", label: "Communication", icon: Megaphone },
];

export default async function MissionsHubPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/missions");

  const sp = await searchParams;
  const activeTab = (TABS.find((t) => t.key === sp.tab)?.key ?? "solo") as MissionRow["kind"];

  const admin = createServiceClient();
  const [missionsRes, completionsRes] = await Promise.all([
    admin
      .from("missions")
      .select("*")
      .eq("active", true)
      .eq("kind", activeTab)
      .order("reward_tokens", { ascending: false }),
    supabase
      .from("mission_completions")
      .select("mission_id, status")
      .order("created_at", { ascending: false }),
  ]);

  const missions = (missionsRes.data ?? []) as MissionRow[];
  const completions = (completionsRes.data ?? []) as CompletionRow[];
  const completionByMission = completions.reduce<Record<string, CompletionRow[]>>(
    (acc, c) => {
      const k = c.mission_id;
      acc[k] = acc[k] ?? [];
      acc[k].push(c);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-7 w-7 text-emerald-300" />
          <h1 className="font-display text-3xl">Missions</h1>
        </div>
        <p className="text-white/70 max-w-2xl">
          Réalise des actions concrètes et gagne des tokens.{" "}
          <span className="text-white/90">100 % légal</span> — aucune mission ne demande de noter
          l&apos;app sur les stores.
        </p>
      </header>

      <nav className="flex gap-2 mb-6 overflow-x-auto" aria-label="Catégories de missions">
        {TABS.map((t) => {
          const isActive = t.key === activeTab;
          const Icon = t.icon;
          return (
            <a
              key={t.key}
              href={`/missions?tab=${t.key}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition border ${
                isActive
                  ? "bg-emerald-300/15 border-emerald-300/40 text-emerald-200"
                  : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </a>
          );
        })}
      </nav>

      <section>
        {missions.length === 0 ? (
          <div className="text-center py-16 text-white/60">
            Aucune mission disponible dans cette catégorie.
            <p className="mt-2 text-xs text-white/40">
              Admin : lance{" "}
              <code className="font-mono text-white/60">npm run seed:missions</code>
            </p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {missions.map((m) => {
              const myCompletions = completionByMission[m.id] ?? [];
              const approved = myCompletions.filter((c) => c.status === "approved").length;
              const pending = myCompletions.filter((c) => c.status === "pending").length;
              const isMaxed =
                m.max_completions != null && approved >= m.max_completions;
              return (
                <li key={m.id}>
                  <MissionCard
                    mission={m}
                    approved={approved}
                    pending={pending}
                    maxed={isMaxed}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-white/50 text-center">
        Toutes les preuves sont validées sous 48 h par l&apos;équipe modération.
        Faux preuves = compte suspendu et tokens annulés.
      </p>
    </div>
  );
}
