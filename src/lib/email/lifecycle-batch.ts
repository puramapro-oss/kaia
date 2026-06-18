/**
 * Envoi d'un batch d'emails lifecycle — logique partagée entre les crons
 * (réactivation, onboarding-drip). Chaque cron fournit ses candidates (sa
 * propre requête) + une fonction `kindFor` ; ce helper gère l'opt-out RGPD,
 * la boucle d'envoi gracieuse et le décompte. Source unique → pas de divergence.
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import { sendKaiaEmail, EMAIL_OPT_OUT_MARKER, type KaiaEmailKind } from "@/lib/email/kaia-emails";
import { signUnsubToken } from "@/lib/email/unsub-token";

export interface LifecycleCandidate {
  id: string;
  email: string | null;
  full_name: string | null;
}

export interface LifecycleBatchResult {
  selected: number;
  sent: number;
  skipped: number;
}

export async function runLifecycleBatch<T extends LifecycleCandidate>(
  admin: ReturnType<typeof createServiceClient>,
  candidates: T[],
  kindFor: (c: T) => KaiaEmailKind | null
): Promise<LifecycleBatchResult> {
  if (candidates.length === 0) return { selected: 0, sent: 0, skipped: 0 };

  // Opt-out RGPD : prefs des candidates uniquement (requête bornée).
  const ids = candidates.map((c) => c.id);
  const { data: prefs } = await admin
    .from("notification_prefs")
    .select("user_id, opted_out")
    .in("user_id", ids);
  const optedOut = new Set(
    (prefs ?? []).filter((p) => (p.opted_out ?? []).includes(EMAIL_OPT_OUT_MARKER)).map((p) => p.user_id as string)
  );

  let sent = 0;
  let skipped = 0;
  for (const c of candidates) {
    const kind = kindFor(c);
    if (!kind || optedOut.has(c.id) || !c.email) {
      skipped++;
      continue;
    }
    const res = await sendKaiaEmail({
      to: c.email,
      kind,
      unsubToken: signUnsubToken(c.id),
      firstName: c.full_name?.trim().split(/\s+/)[0],
    });
    if (res.sent) sent++;
    else skipped++;
  }

  return { selected: candidates.length, sent, skipped };
}
