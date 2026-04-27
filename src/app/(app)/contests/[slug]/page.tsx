import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Sparkles, ShieldCheck, Clock4 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ContestEnterButton } from "@/components/contests/ContestEnterButton";
import { computeEligibleTickets } from "@/lib/contests/eligibility";
import type { ContestRow, ContestPrize } from "@/lib/contests/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export default async function ContestDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/contests/${slug}`);

  const admin = createServiceClient();
  const { data: contest } = await admin
    .from("contests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<ContestRow>();
  if (!contest) notFound();

  const [profileRes, routinesRes, refsRes, ritualsRes, entriesRes] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    supabase
      .from("daily_routines")
      .select("id")
      .eq("user_id", user.id)
      .gte(
        "date",
        new Date(contest.starts_at).toISOString().slice(0, 10)
      )
      .lte(
        "date",
        new Date(contest.ends_at).toISOString().slice(0, 10)
      ),
    supabase
      .from("referrals")
      .select("id")
      .eq("referrer_user_id", user.id)
      .eq("status", "active"),
    supabase.from("ritual_participations").select("id").eq("user_id", user.id),
    supabase
      .from("contest_entries")
      .select("tickets, source, created_at")
      .eq("contest_id", contest.id)
      .eq("user_id", user.id),
  ]);

  const eligible = computeEligibleTickets({
    routinesCompleted: routinesRes.data?.length ?? 0,
    isActiveSubscriber: profileRes.data?.plan === "active",
    referralsConverted: refsRes.data?.length ?? 0,
    ritualsParticipated: ritualsRes.data?.length ?? 0,
    tokensSpentShop: 0,
  });
  const placed = (entriesRes.data ?? []).reduce(
    (acc, e) => acc + (e.tickets as number),
    0
  );
  const remainingQuota = Math.max(0, 50 - placed);
  const remainingEligible = Math.max(0, eligible.total - placed);
  const canEnterCount = Math.min(remainingQuota, Math.max(remainingEligible, 0));
  const isCompleted = contest.status === "completed";
  const winners = (contest.winners ?? []) as Array<{
    rank: number;
    userId: string;
    tickets: number;
    prizeIndex: number;
  }>;
  const prizes = (contest.prizes ?? []) as ContestPrize[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/contests" className="text-sm text-white/60 hover:text-white">
        ← Tous les concours
      </Link>

      <header className="mt-3 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-amber-300" />
          <h1 className="font-display text-3xl">{contest.title}</h1>
        </div>
        {contest.description && (
          <p className="text-white/70 max-w-2xl">{contest.description}</p>
        )}
      </header>

      <section className="grid sm:grid-cols-3 gap-3 mb-8">
        <Stat icon={Clock4} label="Ouverture" value={formatDate(contest.starts_at)} />
        <Stat icon={Clock4} label="Fermeture" value={formatDate(contest.ends_at)} />
        <Stat icon={Trophy} label="Tirage" value={formatDate(contest.draw_at)} />
      </section>

      <section className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
          <h2 className="font-display text-xl mb-3">Mes tickets</h2>
          <div className="text-4xl font-display tabular-nums text-amber-300 mb-1">{placed}</div>
          <p className="text-sm text-white/60 mb-4">
            tickets placés sur ce concours · plafond 50 / user
          </p>
          {!isCompleted && (
            <ContestEnterButton
              contestId={contest.id}
              maxTickets={Math.min(10, canEnterCount)}
              disabled={canEnterCount <= 0}
            />
          )}
          {isCompleted && (
            <p className="text-sm text-white/60">Concours clôturé. Bonne chance pour le prochain ✨</p>
          )}
          {canEnterCount <= 0 && !isCompleted && (
            <p className="mt-3 text-xs text-white/50">
              Termine ta routine du jour, participe au rituel ou parraine quelqu&apos;un pour gagner
              plus de tickets.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
          <h2 className="font-display text-xl mb-3">Lots ({prizes.length})</h2>
          <ol className="space-y-2 text-sm">
            {prizes.map((p) => (
              <li
                key={p.rank}
                className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2"
              >
                <span className="font-mono text-amber-300/90">#{p.rank}</span>
                <span className="text-white/90 flex-1 ml-3">{p.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {isCompleted && (
        <section className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <h2 className="font-display text-xl">Gagnants ({winners.length})</h2>
          </div>
          <ol className="space-y-1 text-sm">
            {winners.map((w) => (
              <li key={w.rank} className="flex items-center gap-3">
                <span className="font-mono text-amber-300/90 w-8">#{w.rank}</span>
                <span className="font-mono text-white/80">
                  {w.userId.slice(0, 4)}…{w.userId.slice(-4)}
                </span>
                <span className="text-white/50 ml-auto">
                  {prizes[w.prizeIndex]?.label ?? "—"}
                </span>
              </li>
            ))}
          </ol>
          {contest.proof_signature && (
            <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="h-4 w-4" />
              <code className="font-mono break-all">
                signature : {contest.proof_signature}
              </code>
            </div>
          )}
        </section>
      )}

      <p className="mt-6 text-xs text-white/50 text-center">
        <Link href="/legal/contests-rules" className="underline hover:text-white/80">
          Règlement officiel
        </Link>{" "}
        — SASU PURAMA · jeu gratuit sans obligation d&apos;achat.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
      <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm">{value} UTC</div>
    </div>
  );
}
