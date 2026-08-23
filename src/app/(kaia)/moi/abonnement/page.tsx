import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { VITAE_PLANS } from "@/lib/stripe";
import { PURITY_LEVELS, AURORA_LEVELS } from "@/lib/constants";
import AbonnementActions from "./AbonnementActions";

export const metadata: Metadata = { title: "Mon abonnement — KAÏA" };

const PURITY_EMOJIS: Record<string, string> = {
  aube: "🌅",
  croissant: "🌙",
  pleine: "🌕",
  sagesse: "⭐",
};

const AURORA_EMOJIS: Record<string, string> = {
  brume: "🌫️",
  onde: "〰️",
  aura: "✨",
  polaris: "🌟",
};

export default async function AbonnementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("vitae_plan, purity_level, aurora_level, subscription_status, subscription_period_end")
    .eq("id", user.id)
    .maybeSingle();

  const currentPlan = profile?.vitae_plan ?? "free";
  const hasActiveSubscription =
    profile?.subscription_status === "active" || profile?.subscription_status === "trialing";

  const periodEnd = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const purityLevel = profile?.purity_level ?? "aube";
  const auroraLevel = profile?.aurora_level ?? "brume";

  return (
    <div className="px-5 py-8 max-w-xl mx-auto space-y-7">
      <header className="flex items-center gap-3 mb-2">
        <Link
          href="/moi"
          className="p-1.5 glass rounded-xl hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Link>
        <h1 className="font-display text-2xl font-semibold">Mon abonnement</h1>
      </header>

      {/* Current plan status */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest mb-1">
              Plan actuel
            </p>
            <p className="font-display text-xl font-semibold">
              VITAE {currentPlan === "free" ? "Gratuit" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </p>
          </div>
          {currentPlan !== "free" && (
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                background: hasActiveSubscription
                  ? "rgba(232,200,122,0.15)"
                  : "rgba(240,176,192,0.15)",
                color: hasActiveSubscription
                  ? "var(--kaia-gold)"
                  : "var(--kaia-rose)",
              }}
            >
              {hasActiveSubscription ? "Actif" : "Inactif"}
            </span>
          )}
        </div>
        {periodEnd && (
          <p className="text-xs text-[var(--foreground-muted)]">
            {profile?.subscription_status === "trialing"
              ? `Essai jusqu'au ${periodEnd}`
              : `Renouvellement le ${periodEnd}`}
          </p>
        )}

        {/* Levels */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl p-3" style={{ background: "rgba(200,185,240,0.08)", border: "1px solid rgba(200,185,240,0.15)" }}>
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Niveau Pureté</p>
            <div className="flex items-center gap-2">
              <span>{PURITY_EMOJIS[purityLevel] ?? "🌅"}</span>
              <span className="text-sm font-medium capitalize">{purityLevel}</span>
            </div>
            <div className="flex gap-1 mt-2">
              {PURITY_LEVELS.map((lvl) => (
                <div
                  key={lvl}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    background:
                      PURITY_LEVELS.indexOf(lvl) <= PURITY_LEVELS.indexOf(purityLevel as typeof PURITY_LEVELS[number])
                        ? "var(--kaia-moon)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(144,192,232,0.08)", border: "1px solid rgba(144,192,232,0.15)" }}>
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Niveau AURORA</p>
            <div className="flex items-center gap-2">
              <span>{AURORA_EMOJIS[auroraLevel] ?? "🌫️"}</span>
              <span className="text-sm font-medium capitalize">{auroraLevel}</span>
            </div>
            <div className="flex gap-1 mt-2">
              {AURORA_LEVELS.map((lvl) => (
                <div
                  key={lvl}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    background:
                      AURORA_LEVELS.indexOf(lvl) <= AURORA_LEVELS.indexOf(auroraLevel as typeof AURORA_LEVELS[number])
                        ? "#90C0E8"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <section>
        <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest mb-3">
          Plans VITAE
        </p>
        <div className="space-y-3">
          {VITAE_PLANS.map((plan) => {
            const isActive = currentPlan === plan.key;
            return (
              <div
                key={plan.key}
                className="glass rounded-2xl p-5 transition-all"
                style={
                  isActive
                    ? { borderColor: "rgba(200,185,240,0.4)", borderWidth: "1px" }
                    : {}
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-display text-lg font-semibold capitalize">
                      {plan.key}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--kaia-gold)]">{plan.priceLabel}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">/mois</p>
                  </div>
                </div>
                {isActive ? (
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(200,185,240,0.15)] text-[var(--kaia-moon)]">
                    Plan actuel
                  </span>
                ) : (
                  <AbonnementActions planKey={plan.key} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Legal */}
      <p className="text-xs text-center text-[var(--foreground-muted)] leading-relaxed pb-4">
        Abonnement mensuel sans engagement. Annulable à tout moment depuis le portail de
        gestion. {" "}
        <Link href="/cgv" className="hover:underline underline-offset-2">
          CGV
        </Link>{" "}
        ·{" "}
        <Link href="/politique-confidentialite" className="hover:underline underline-offset-2">
          Confidentialité
        </Link>
      </p>
    </div>
  );
}
