import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, Clock4, Sparkles, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ensurePeriodContest } from "@/lib/contests/ensure-period-contest";
import { computeEligibleTickets } from "@/lib/contests/eligibility";
import type { ContestRow } from "@/lib/contests/types";

export const metadata = {
  title: "Concours — KAÏA",
  description: "Tirages weekly, monthly, yearly. 10 gagnants par tirage. Gratuit.",
};

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  weekly: "Tirage hebdomadaire",
  monthly: "Tirage mensuel",
  yearly: "Grand tirage annuel",
};

const KIND_ICON: Record<string, typeof Trophy> = {
  weekly: Sparkles,
  monthly: CalendarDays,
  yearly: Trophy,
};

function computeStartDate(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

function timeUntil(dateIso: string): string {
  const ms = new Date(dateIso).getTime() - Date.now();
  if (ms <= 0) return "Tirage en cours";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

export default async function ContestsHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/contests");

  const admin = createServiceClient();

  // Garantit que les 3 concours en cours existent
  await Promise.all([
    ensurePeriodContest({ admin, cadence: "weekly" }),
    ensurePeriodContest({ admin, cadence: "monthly" }),
    ensurePeriodContest({ admin, cadence: "yearly" }),
  ]);

  // Charge les 3 concours actifs
  const { data: contests } = await admin
    .from("contests")
    .select("*")
    .in("status", ["live", "upcoming"])
    .order("draw_at", { ascending: true });

  const list = (contests ?? []) as ContestRow[];

  // Stats user pour estimation tickets gagnables
  const [profileRes, routinesRes, refsRes, ritualsRes] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    supabase
      .from("daily_routines")
      .select("id")
      .eq("user_id", user.id)
      .gte("date", computeStartDate(30)),
    supabase
      .from("referrals")
      .select("id")
      .eq("referrer_user_id", user.id)
      .eq("status", "active"),
    supabase.from("ritual_participations").select("id").eq("user_id", user.id),
  ]);

  const isActive = profileRes.data?.plan === "active";
  const eligible = computeEligibleTickets({
    routinesCompleted: routinesRes.data?.length ?? 0,
    isActiveSubscriber: isActive,
    referralsConverted: refsRes.data?.length ?? 0,
    ritualsParticipated: ritualsRes.data?.length ?? 0,
    tokensSpentShop: 0,
  });

  // Tickets déjà placés pour chaque contest
  const contestIds = list.map((c) => c.id);
  let entriesByContest: Record<string, number> = {};
  if (contestIds.length > 0) {
    const { data: entries } = await supabase
      .from("contest_entries")
      .select("contest_id, tickets")
      .in("contest_id", contestIds);
    entriesByContest = (entries ?? []).reduce<Record<string, number>>((acc, e) => {
      const k = e.contest_id as string;
      acc[k] = (acc[k] ?? 0) + (e.tickets as number);
      return acc;
    }, {});
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-amber-300" />
          <h1 className="font-display text-3xl">Concours KAÏA</h1>
        </div>
        <p className="text-white/70 max-w-2xl">
          10 gagnants par tirage. Gratuit. Tu accumules des tickets en faisant ta routine,
          en participant aux rituels collectifs et en parrainant des proches.
        </p>
      </header>

      <section className="mb-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="font-display text-xl">Tickets disponibles cette période</h2>
          <span className="text-sm text-white/60">
            {eligible.total} / 50 (plafond / concours)
          </span>
        </div>
        {eligible.breakdown.length === 0 ? (
          <p className="text-sm text-white/60">
            Tu n&apos;as encore gagné aucun ticket. Termine ta routine du jour pour en obtenir 1.
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {eligible.breakdown.map((b) => (
              <li
                key={b.source}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2"
              >
                <span className="text-white/70">{b.rule}</span>
                <span className="font-mono text-amber-300">+{b.tickets}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        {list.length === 0 && (
          <div className="lg:col-span-3 text-center py-12 text-white/60">
            Aucun concours actif pour le moment.
          </div>
        )}
        {list.map((c) => {
          const Icon = KIND_ICON[c.kind] ?? Trophy;
          const placed = entriesByContest[c.id] ?? 0;
          return (
            <Link
              key={c.id}
              href={`/contests/${c.slug}`}
              className="group rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 hover:border-amber-300/40 transition"
            >
              <div className="flex items-center gap-2 text-amber-300/90 mb-2">
                <Icon className="h-5 w-5" />
                <span className="text-xs uppercase tracking-wide">{KIND_LABEL[c.kind]}</span>
              </div>
              <h3 className="font-display text-xl mb-3">{c.title}</h3>
              <p className="text-sm text-white/70 line-clamp-2 mb-4">
                {c.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Clock4 className="h-4 w-4" />
                    Tirage dans
                  </span>
                  <span className="text-white/90 tabular-nums">{timeUntil(c.draw_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Mes tickets placés</span>
                  <span className="font-mono text-amber-300">{placed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Lots</span>
                  <span className="text-white/90">{(c.prizes ?? []).length}</span>
                </div>
              </div>
              <div className="mt-4 text-amber-300 text-sm group-hover:underline">
                Voir le concours →
              </div>
            </Link>
          );
        })}
      </section>

      <p className="mt-10 text-xs text-white/50 text-center">
        Aucune participation n&apos;est conditionnée à un abonnement payant.{" "}
        <Link href="/legal/contests-rules" className="underline hover:text-white/80">
          Règlement officiel
        </Link>
      </p>
    </div>
  );
}
