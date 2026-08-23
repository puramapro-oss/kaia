import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { MultisensorialProvider } from "@/components/multisensorial/MultisensorialProvider";
import { ParallaxNatureBackground } from "@/components/multisensorial/ParallaxNatureBackground";
import LegalReacceptanceGateClient from "@/components/shared/LegalReacceptanceGateClient";
import { computeDocsEnAttente } from "@/lib/legal/versions";
import type { LegalDocType } from "@/lib/legal/types";
import {
  DEFAULT_MULTISENSORIAL_PREFS,
  type MultisensorialPrefs,
} from "@/hooks/useMultisensorialPrefs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, onboarded_at, multisensorial_background_video, multisensorial_haptics, multisensorial_binaural, multisensorial_cinematic, accessibility_reduced_motion"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");

  // Best-effort : si la table `legal_acceptances` n'existe pas encore en prod (migration
  // 001_legal_core.sql non jouée, cf ERRORS.md 2026-08-23), on n'affiche aucun gate plutôt
  // que de faire planter tout le layout authentifié pour tous les users.
  let docsEnAttente: LegalDocType[] = [];
  const { data: acceptances, error: acceptancesError } = await supabase
    .from("legal_acceptances")
    .select("doc_type, version")
    .eq("user_id", user.id);
  if (!acceptancesError) {
    const dernieresAcceptations = Object.fromEntries(
      (acceptances ?? []).map((a) => [a.doc_type, a.version])
    ) as Partial<Record<LegalDocType, string>>;
    docsEnAttente = computeDocsEnAttente(dernieresAcceptations);
  }

  const prefs: MultisensorialPrefs = profile
    ? {
        background_video: profile.multisensorial_background_video ?? DEFAULT_MULTISENSORIAL_PREFS.background_video,
        haptics: profile.multisensorial_haptics ?? DEFAULT_MULTISENSORIAL_PREFS.haptics,
        binaural: profile.multisensorial_binaural ?? DEFAULT_MULTISENSORIAL_PREFS.binaural,
        cinematic: profile.multisensorial_cinematic ?? DEFAULT_MULTISENSORIAL_PREFS.cinematic,
        reduced_motion: profile.accessibility_reduced_motion ?? DEFAULT_MULTISENSORIAL_PREFS.reduced_motion,
      }
    : DEFAULT_MULTISENSORIAL_PREFS;

  return (
    <MultisensorialProvider prefs={prefs}>
      <ParallaxNatureBackground intensity={0.55} />
      <AppShell user={{ email: user.email, full_name: profile?.full_name ?? null }}>
        {children}
      </AppShell>
      <LegalReacceptanceGateClient docsEnAttente={docsEnAttente} />
    </MultisensorialProvider>
  );
}
