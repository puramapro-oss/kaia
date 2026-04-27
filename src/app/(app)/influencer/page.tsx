/**
 * Espace ambassadeur — `/influencer`
 *
 *  - Si pas de candidature → form `/influencer/apply`
 *  - Si candidature `pending` → message d'attente + edit
 *  - Si `rejected` → message + soumettre à nouveau
 *  - Si `approved` sans link → bouton "Créer mon lien"
 *  - Si `approved` avec link → dashboard (link + stats summary + 3 cards CTA)
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, Coins, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassCardHeading } from "@/components/ui/Card";
import { InfluencerApplyForm } from "@/components/influencer/InfluencerApplyForm";

export const dynamic = "force-dynamic";

export default async function InfluencerHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/influencer");

  const { data: application } = await supabase
    .from("influencer_applications")
    .select("status, pitch, audience_size, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: link } = await supabase
    .from("influencer_links")
    .select("id, code, promo_active_until")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  // Cas 1 : aucune candidature → form
  if (!application) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <GlassCardHeading
          eyebrow="Programme ambassadeur·rice"
          title="Rejoindre KAÏA"
          subtitle="Présente-toi en quelques mots. Tissma valide les profils sous 48h."
        />
        <div className="mt-8">
          <InfluencerApplyForm />
        </div>
      </div>
    );
  }

  // Cas 2 : candidature pending
  if (application.status === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <GlassCardHeading
          eyebrow="Candidature en cours"
          title="Tu es sur la liste 🌱"
          subtitle="Tissma examine ton profil. Tu reçois un mail dès validation (sous 48h)."
        />
        <GlassCard>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            En attendant, tu peux explorer le{" "}
            <Link href="/influencers/kit" className="text-[var(--color-kaia-accent)] underline-offset-4 hover:underline">
              kit de communication
            </Link>{" "}
            pour te préparer.
          </p>
          <p className="text-xs text-white/40">
            Soumis le {new Date(application.created_at).toLocaleDateString("fr-FR")}
          </p>
        </GlassCard>
      </div>
    );
  }

  // Cas 3 : rejected
  if (application.status === "rejected") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <GlassCardHeading
          eyebrow="Candidature non retenue"
          title="Pas cette fois"
          subtitle="Tu peux nous écrire à tissma@purama.dev pour comprendre ou re-postuler dans 30 jours."
        />
      </div>
    );
  }

  // Cas 4 : approved sans link
  if (application.status === "approved" && !link) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <GlassCardHeading
          eyebrow="Bienvenue dans le programme"
          title="Crée ton lien"
          subtitle="On va générer ton code unique. Promo amie de 7 jours activée automatiquement."
        />
        <Link
          href="/influencer/links"
          className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-2xl text-[15px] font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim"
        >
          Créer mon lien
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Cas 5 : dashboard complet
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <GlassCardHeading
        eyebrow="Espace ambassadeur·rice"
        title="Ton tableau de bord"
        subtitle="Suis tes liens, tes commissions, et tes versements."
      />
      {link ? (
        <GlassCard className="bg-[rgba(244,196,48,0.04)] border border-[var(--color-kaia-gold)]/20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--color-kaia-gold)]/80 mb-1">
                Ton code
              </p>
              <p className="font-display text-3xl text-white">{link.code}</p>
            </div>
            <Link
              href="/influencer/links"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/80 bg-white/5 hover:bg-white/10 wellness-anim"
            >
              Lien & QR
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/influencer/stats" className="block">
          <GlassCard className="h-full hover:bg-white/[0.07]">
            <BarChart3 className="w-5 h-5 text-[var(--color-kaia-accent)] mb-3" />
            <h3 className="font-display text-lg text-white mb-1">Statistiques</h3>
            <p className="text-sm text-white/60">Clics, conversions, commissions par mois.</p>
          </GlassCard>
        </Link>
        <Link href="/influencer/links" className="block">
          <GlassCard className="h-full hover:bg-white/[0.07]">
            <Link2 className="w-5 h-5 text-[var(--color-kaia-gold)] mb-3" />
            <h3 className="font-display text-lg text-white mb-1">Lien & QR</h3>
            <p className="text-sm text-white/60">Copie ton lien personnel, télécharge le QR.</p>
          </GlassCard>
        </Link>
        <Link href="/influencer/payouts" className="block">
          <GlassCard className="h-full hover:bg-white/[0.07]">
            <Coins className="w-5 h-5 text-[var(--color-kaia-terracotta)] mb-3" />
            <h3 className="font-display text-lg text-white mb-1">Versements</h3>
            <p className="text-sm text-white/60">Demande tes paiements (min. 50 € · IBAN).</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
