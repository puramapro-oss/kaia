import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Settings, CreditCard, HelpCircle, LogOut, Star, Target, Coins, Trophy, Users } from "lucide-react";

export const metadata: Metadata = { title: "Moi — KAÏA" };

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, prenom, vitae_plan, streak_days, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const initials = (
    profile?.prenom?.[0] ??
    profile?.display_name?.[0] ??
    user.email?.[0] ??
    "K"
  ).toUpperCase();

  const displayName = profile?.prenom ?? profile?.display_name ?? user.email?.split("@")[0] ?? "Toi";

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-[var(--kaia-night)] flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--kaia-moon) 0%, var(--kaia-rose) 100%)" }}>
          {initials}
        </div>
        <div>
          <p className="font-display text-xl font-semibold">{displayName}</p>
          <p className="text-sm text-[var(--foreground-muted)]">{user.email}</p>
          {profile?.vitae_plan && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full bg-[rgba(232,200,122,0.15)] text-[var(--kaia-gold)]">
              <Star size={10} strokeWidth={1.5} />
              VITAE {profile.vitae_plan.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* KARMA menu */}
      <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
        <Link href="/moi/missions" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <Target size={18} className="text-[var(--kaia-moon)]" strokeWidth={1.5} />
          <span className="text-sm">Missions</span>
        </Link>
        <Link href="/moi/karma" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <Coins size={18} className="text-[var(--kaia-gold)]" strokeWidth={1.5} />
          <span className="text-sm">KARMA &amp; Jeux</span>
        </Link>
        <Link href="/moi/concours" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <Trophy size={18} className="text-[var(--kaia-moon)]" strokeWidth={1.5} />
          <span className="text-sm">Concours</span>
        </Link>
        <Link href="/moi/parrainage" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <Users size={18} className="text-[var(--foreground-muted)]" strokeWidth={1.5} />
          <span className="text-sm">Parrainage</span>
        </Link>
      </div>

      {/* Settings menu */}
      <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
        <Link href="/moi/reglages" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <Settings size={18} className="text-[var(--foreground-muted)]" strokeWidth={1.5} />
          <span className="text-sm">Réglages</span>
        </Link>
        <Link href="/moi/abonnement" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <CreditCard size={18} className="text-[var(--foreground-muted)]" strokeWidth={1.5} />
          <span className="text-sm">Mon abonnement VITAE</span>
        </Link>
        <Link href="/aide" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
          <HelpCircle size={18} className="text-[var(--foreground-muted)]" strokeWidth={1.5} />
          <span className="text-sm">Aide &amp; FAQ</span>
        </Link>
      </div>

      {/* Sign out */}
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          className="w-full glass rounded-2xl px-5 py-4 flex items-center gap-3 hover:bg-[rgba(240,176,192,0.08)] transition-all text-[var(--kaia-rose)] group"
        >
          <LogOut size={18} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm">Se déconnecter</span>
        </button>
      </form>

      <p className="text-xs text-center text-[var(--foreground-muted)] pb-4">
        KAÏA V2 · SASU PURAMA · <Link href="/legal/privacy" className="hover:underline underline-offset-2">Confidentialité</Link>
      </p>
    </div>
  );
}
