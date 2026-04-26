import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ImpactTabs, type ImpactTab } from "./Tabs";
import { PersonalTab } from "./PersonalTab";
import { CollectiveTab } from "./CollectiveTab";
import { MapTab } from "./MapTab";
import { readImpact, readGlobalExtras } from "@/lib/impact/aggregate";

export const metadata = {
  title: "Impact — KAÏA",
  description: "Ce que tu fais avec ta routine, ce que la communauté fait ensemble.",
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const isTab = (v: string | undefined): v is ImpactTab =>
  v === "personal" || v === "collective" || v === "map";

export default async function ImpactPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab: ImpactTab = isTab(params.tab) ? params.tab : "personal";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Impact</span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Ce que tu sèmes — et ce que nous semons.
        </h1>
        <p className="text-white/55 max-w-2xl">
          Trois vues : la tienne, celle de la communauté, et la carte vivante du monde.
        </p>
      </header>

      <ImpactTabs active={tab} />

      {tab === "personal" && <PersonalSection userId={user.id} />}
      {tab === "collective" && <CollectiveSection />}
      {tab === "map" && <MapTab />}
    </div>
  );
}

async function PersonalSection({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: impact }, { data: tokens }, { count: practicesCount }, { data: routines }] =
    await Promise.all([
      supabase.from("user_impact").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("user_tokens")
        .select("lifetime_earned")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("practice_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      supabase
        .from("daily_routines")
        .select("total_seconds")
        .eq("user_id", userId),
    ]);

  const totalSeconds = (routines ?? []).reduce(
    (s, r) => s + (typeof r.total_seconds === "number" ? r.total_seconds : 0),
    0,
  );

  return (
    <PersonalTab
      impact={readImpact(impact)}
      tokensLifetimeEarned={tokens?.lifetime_earned ?? 0}
      practicesCount={practicesCount ?? 0}
      routinesCount={routines?.length ?? 0}
      totalMinutes={Math.round(totalSeconds / 60)}
    />
  );
}

async function CollectiveSection() {
  // Service client : on agrège des données publiques (global_impact public_read,
  // mais leaderboard nécessite de croiser user_impact + profiles avec service-role).
  const admin = createServiceClient();

  const [{ data: global }, { data: leaderRows }] = await Promise.all([
    admin.from("global_impact").select("*").eq("id", 1).maybeSingle(),
    admin
      .from("user_impact")
      .select("user_id, trees_planted, people_helped, euros_redistributed")
      .order("trees_planted", { ascending: false })
      .limit(10),
  ]);

  const userIds = (leaderRows ?? []).map((r) => r.user_id);
  let nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      const name =
        (typeof p.full_name === "string" && p.full_name.length > 0 ? p.full_name : null) ??
        (typeof p.email === "string" ? p.email.split("@")[0] : null) ??
        "Anonyme";
      nameMap.set(p.id, name);
    }
  }

  const leaderboard = (leaderRows ?? []).map((r, idx) => ({
    rank: idx + 1,
    fullName: nameMap.get(r.user_id) ?? "Anonyme",
    trees: typeof r.trees_planted === "number" ? r.trees_planted : 0,
    helped: typeof r.people_helped === "number" ? r.people_helped : 0,
    euros:
      typeof r.euros_redistributed === "number"
        ? r.euros_redistributed
        : parseFloat(String(r.euros_redistributed ?? "0")) || 0,
  }));

  const globalCounters = readImpact(global);
  const extras = readGlobalExtras(global);

  return (
    <CollectiveTab
      global={globalCounters}
      routinesCompleted={extras.routinesCompleted}
      activeUsers30d={extras.activeUsers30d}
      leaderboard={leaderboard}
    />
  );
}
