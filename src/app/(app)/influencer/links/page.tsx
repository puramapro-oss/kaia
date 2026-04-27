/**
 * `/influencer/links` — code + lien partage + QR + promo countdown.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassCardHeading } from "@/components/ui/Card";
import { CopyTextButton } from "@/components/influencer/CopyTextButton";
import { LinkQrCode } from "@/components/influencer/LinkQrCode";
import { CreateLinkButton } from "@/components/influencer/CreateLinkButton";
import { PromoCountdown } from "@/components/influencer/PromoCountdown";

export const dynamic = "force-dynamic";

const APP_HOST = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaia.purama.dev";

export default async function InfluencerLinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/influencer/links");

  const { data: link } = await supabase
    .from("influencer_links")
    .select("id, code, promo_active_until")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  const fullUrl = link ? `${APP_HOST}/i/${link.code}` : null;
  const promoUntil =
    link?.promo_active_until && new Date(link.promo_active_until) > new Date()
      ? (link.promo_active_until as string)
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/influencer"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white wellness-anim"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l'espace
      </Link>

      <GlassCardHeading
        eyebrow="Mon lien personnel"
        title="Code, lien & QR"
        subtitle="Partage cette URL ou ce QR — chaque clic est tracké et chaque inscription est attribuée."
      />

      {!link ? (
        <GlassCard>
          <p className="text-sm text-white/70 mb-5">Aucun lien actif. Crée-le maintenant — la promo amie 7 jours sera activée automatiquement.</p>
          <CreateLinkButton />
        </GlassCard>
      ) : null}

      {link && fullUrl ? (
        <>
          <GlassCard className="bg-[rgba(244,196,48,0.04)] border border-[var(--color-kaia-gold)]/20">
            <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--color-kaia-gold)]/80 mb-2">
              Code unique
            </p>
            <p className="font-display text-5xl text-white tabular-nums select-all">{link.code}</p>
          </GlassCard>

          <GlassCard>
            <p className="text-[11px] tracking-[0.18em] uppercase text-white/50 mb-3">Lien complet</p>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <code className="text-sm text-white/85 font-mono break-all">{fullUrl}</code>
              <CopyTextButton text={fullUrl}>Copier le lien</CopyTextButton>
            </div>
          </GlassCard>

          {promoUntil ? (
            <GlassCard className="border border-[var(--color-kaia-accent)]/20">
              <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--color-kaia-accent)] mb-3">
                Promo amie active
              </p>
              <PromoCountdown until={promoUntil} />
              <p className="text-xs text-white/50 mt-3 leading-relaxed">
                Pendant cette fenêtre, les nouvelles inscriptions via ton lien bénéficient d'un
                coupon. Au-delà, ton lien reste actif (10 % à vie sur chaque renouvellement).
              </p>
            </GlassCard>
          ) : null}

          <GlassCard>
            <p className="text-[11px] tracking-[0.18em] uppercase text-white/50 mb-3">QR code</p>
            <LinkQrCode value={fullUrl} />
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}
