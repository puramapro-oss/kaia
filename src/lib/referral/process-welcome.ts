/**
 * Helper invoqué dans `/auth/callback` après une 1ère connexion.
 * Lit le cookie `kaia_ref` (parrainage) et :
 *   - crée la ligne `referrals` (status pending) si elle n'existe pas
 *   - crédite +200 tokens bienvenue au filleul (idempotent par
 *     `referee_welcome_<userId>`)
 *
 * Appelé depuis Server Component => peut accéder à service role.
 * Volontairement résilient : aucun throw remonté à l'utilisateur si la
 * table referrals/RPC n'est pas dispo (mode dégradé).
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import { REFERRAL_REFEREE_WELCOME_TOKENS } from "./commission-rules";

type AdminClient = ReturnType<typeof createServiceClient>;

export interface RefereeWelcomeResult {
  paired: boolean;
  bonusTokensApplied: boolean;
  reason?: string;
}

export async function processRefereeWelcome(params: {
  admin: AdminClient;
  refereeUserId: string;
  referrerCode: string;
}): Promise<RefereeWelcomeResult> {
  const { admin, refereeUserId, referrerCode } = params;
  const cleanCode = referrerCode.trim().toLowerCase();
  if (!cleanCode || !/^[a-z0-9-]{4,32}$/.test(cleanCode)) {
    return { paired: false, bonusTokensApplied: false, reason: "invalid_code" };
  }

  // Trouve le parrain
  const { data: referrer, error: refErr } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", cleanCode)
    .maybeSingle();
  if (refErr || !referrer) {
    return {
      paired: false,
      bonusTokensApplied: false,
      reason: "referrer_not_found",
    };
  }
  if (referrer.id === refereeUserId) {
    return {
      paired: false,
      bonusTokensApplied: false,
      reason: "self_referral_blocked",
    };
  }

  // Vérifie qu'on n'a pas déjà appairé ce filleul
  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_user_id", refereeUserId)
    .maybeSingle();

  let paired = Boolean(existing);
  if (!existing) {
    const insert = await admin
      .from("referrals")
      .insert({
        referrer_user_id: referrer.id,
        referred_user_id: refereeUserId,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    paired = Boolean(insert.data && !insert.error);
  }

  // Crédite +200 tokens filleul (idempotent)
  let bonusTokensApplied = false;
  const idempKey = `referee_welcome_${refereeUserId}`;
  const { data, error } = await admin.rpc("apply_token_event", {
    p_user_id: refereeUserId,
    p_delta: REFERRAL_REFEREE_WELCOME_TOKENS,
    p_reason: "referee_welcome",
    p_metadata: { referrerId: referrer.id, source: "auth_callback" },
    p_idempotency_key: idempKey,
  });
  if (!error && Array.isArray(data) && data[0]?.applied) {
    bonusTokensApplied = true;
  }

  return { paired, bonusTokensApplied };
}
