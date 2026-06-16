import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Moon, Sparkles, Wind, Users } from "lucide-react";

export const metadata: Metadata = { title: "Accueil — KAÏA" };

export default async function AccueilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, prenom, onboarding_completed, vitae_plan, streak_days")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const prenom = profile?.prenom ?? profile?.display_name ?? user.email?.split("@")[0] ?? "toi";

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <p className="text-sm text-[var(--foreground-muted)] mb-1">Bonjour,</p>
        <h1 className="font-display text-4xl font-semibold gradient-kaia-text capitalize">
          {prenom}
        </h1>
      </header>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/cycle" className="glass rounded-2xl p-5 flex flex-col gap-3 hover:bg-[rgba(200,185,240,0.1)] transition-all group">
          <Moon size={22} className="text-[var(--kaia-moon)] group-hover:drop-shadow-[0_0_8px_rgba(200,185,240,0.8)] transition-all" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">Mon Cycle</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Suivre ma phase</p>
          </div>
        </Link>
        <Link href="/luna" className="glass rounded-2xl p-5 flex flex-col gap-3 hover:bg-[rgba(200,185,240,0.1)] transition-all group">
          <Sparkles size={22} className="text-[var(--kaia-gold)] group-hover:drop-shadow-[0_0_8px_rgba(232,200,122,0.8)] transition-all" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">LUNA</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Mon guide IA</p>
          </div>
        </Link>
        <Link href="/aurora" className="glass rounded-2xl p-5 flex flex-col gap-3 hover:bg-[rgba(200,185,240,0.1)] transition-all group">
          <Wind size={22} className="text-[var(--kaia-rose)] group-hover:drop-shadow-[0_0_8px_rgba(240,176,192,0.8)] transition-all" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">AURORA</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Respiration guidée</p>
          </div>
        </Link>
        <Link href="/cercles" className="glass rounded-2xl p-5 flex flex-col gap-3 hover:bg-[rgba(200,185,240,0.1)] transition-all group">
          <Users size={22} className="text-[var(--kaia-moon)] group-hover:drop-shadow-[0_0_8px_rgba(200,185,240,0.8)] transition-all" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">Cercles</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Intentions collectives</p>
          </div>
        </Link>
      </div>

      {/* Phase banner — P2 will replace with real data */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🌙</span>
          <div>
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest">Phase actuelle</p>
            <p className="font-display text-lg font-semibold text-[var(--kaia-moon)]">En cours d&apos;analyse…</p>
          </div>
        </div>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          Entre la date de tes dernières règles dans{" "}
          <Link href="/cycle" className="text-[var(--kaia-moon)] hover:underline underline-offset-2">Mon Cycle</Link>{" "}
          pour activer l&apos;intelligence KAÏA.
        </p>
      </div>
    </div>
  );
}
