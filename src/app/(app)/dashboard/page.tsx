import { Sparkles, Wind, Heart } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mon espace" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, plan, streak_days, awakening_level")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const firstName = profile?.full_name?.split(" ")[0] ?? "toi";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Bienvenue chez toi, {firstName}.
        </h1>
        <p className="text-white/55">
          Quelques respirations, un petit geste pour toi. Choisis ton point d'entrée du jour.
        </p>
      </header>

      <section aria-label="Routine du jour" className="grid gap-5 md:grid-cols-3">
        <GlassCard className="space-y-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-kaia-accent)]/15 text-[var(--color-kaia-accent)]">
            <Wind className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl text-white tracking-tight">Respiration 4·7·8</h2>
            <p className="text-sm text-white/55">3 minutes — calme le système nerveux.</p>
          </div>
          <Link
            href="/dashboard/routine"
            className="inline-flex items-center text-sm text-white/80 hover:text-white wellness-anim"
          >
            Démarrer →
          </Link>
        </GlassCard>

        <GlassCard className="space-y-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-kaia-gold)]/15 text-[var(--color-kaia-gold)]">
            <Sparkles className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl text-white tracking-tight">Routine du matin</h2>
            <p className="text-sm text-white/55">4 min · respiration + intention + mouvement.</p>
          </div>
          <Link
            href="/dashboard/routine"
            className="inline-flex items-center text-sm text-white/80 hover:text-white wellness-anim"
          >
            Composer →
          </Link>
        </GlassCard>

        <GlassCard className="space-y-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-kaia-terracotta)]/15 text-[var(--color-kaia-terracotta)]">
            <Heart className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl text-white tracking-tight">Gratitude</h2>
            <p className="text-sm text-white/55">3 lignes pour ancrer ce que tu apprécies aujourd'hui.</p>
          </div>
          <Link
            href="/dashboard/universe"
            className="inline-flex items-center text-sm text-white/80 hover:text-white wellness-anim"
          >
            Écrire →
          </Link>
        </GlassCard>
      </section>

      <section aria-label="Aperçu" className="grid gap-5 sm:grid-cols-3">
        <GlassCard className="text-center py-7 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Streak</p>
          <p className="font-display text-3xl text-white">{profile?.streak_days ?? 0} j</p>
          <p className="text-xs text-white/40">Continue, c'est fluide.</p>
        </GlassCard>
        <GlassCard className="text-center py-7 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Niveau d'éveil</p>
          <p className="font-display text-3xl text-white">{profile?.awakening_level ?? 1}</p>
          <p className="text-xs text-white/40">Éveillé · au début du chemin</p>
        </GlassCard>
        <GlassCard className="text-center py-7 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Plan</p>
          <p className="font-display text-2xl text-white capitalize">
            {profile?.plan ?? "free"}
          </p>
          <p className="text-xs text-white/40">14 jours d'essai à découvrir</p>
        </GlassCard>
      </section>
    </div>
  );
}
