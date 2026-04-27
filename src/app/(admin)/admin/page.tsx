import { createServiceClient } from "@/lib/supabase/admin";
import { Trophy, HandHeart, Compass, ShoppingBag, Users, FileWarning } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createServiceClient();

  const [users, missionsPending, payoutsPending, donationsToday, contestsLive, flags] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin
        .from("mission_completions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("influencer_payouts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("donations")
        .select("amount_cents")
        .eq("status", "succeeded")
        .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      admin
        .from("contests")
        .select("id", { count: "exact", head: true })
        .eq("status", "live"),
      admin
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .gte("flag_count", 1),
    ]);

  const donationsAmount = (donationsToday.data ?? []).reduce(
    (acc, d) => acc + ((d.amount_cents as number) ?? 0),
    0
  );

  const stats: Array<{ label: string; value: string; href: string; icon: typeof Users; tone: string }> = [
    { label: "Utilisateurs", value: String(users.count ?? 0), href: "/admin/users", icon: Users, tone: "text-white" },
    { label: "Missions à valider", value: String(missionsPending.count ?? 0), href: "/admin/missions", icon: Compass, tone: "text-emerald-300" },
    { label: "Payouts en attente", value: String(payoutsPending.count ?? 0), href: "/admin/payouts", icon: ShoppingBag, tone: "text-amber-300" },
    { label: "Dons 24h", value: `${(donationsAmount / 100).toFixed(2)} €`, href: "/admin/donations", icon: HandHeart, tone: "text-rose-300" },
    { label: "Concours actifs", value: String(contestsLive.count ?? 0), href: "/admin/content", icon: Trophy, tone: "text-amber-300" },
    { label: "Posts signalés", value: String(flags.count ?? 0), href: "/admin/content", icon: FileWarning, tone: "text-rose-300" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 hover:border-amber-300/40 transition"
            >
              <div className={`flex items-center gap-2 mb-2 ${s.tone}`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="font-display text-3xl tabular-nums">{s.value}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
