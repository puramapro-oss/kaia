/**
 * Helper server-side : crée/lit/révoque les sessions admin via DB.
 */
import type { createServiceClient } from "@/lib/supabase/admin";
import {
  ADMIN_SESSION_TTL_HOURS,
  generateSessionToken,
  hashSessionToken,
} from "./auth";

type AdminClient = ReturnType<typeof createServiceClient>;

export interface AdminSession {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
}

export async function createAdminSession(params: {
  admin: AdminClient;
  userId: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ rawToken: string; expiresAt: Date } | null> {
  const { rawToken, hash } = (() => {
    const t = generateSessionToken();
    return { rawToken: t.raw, hash: t.hash };
  })();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_HOURS * 3600 * 1000);
  const { error } = await params.admin.from("admin_sessions").insert({
    user_id: params.userId,
    token_hash: hash,
    ip_address: params.ip ?? null,
    user_agent: params.userAgent ?? null,
    expires_at: expiresAt.toISOString(),
  });
  if (error) return null;
  return { rawToken, expiresAt };
}

export async function findAdminSession(params: {
  admin: AdminClient;
  rawToken: string;
}): Promise<AdminSession | null> {
  const hash = hashSessionToken(params.rawToken);
  const { data } = await params.admin
    .from("admin_sessions")
    .select("id, user_id, expires_at, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;
  // bump last_seen_at (best-effort)
  await params.admin
    .from("admin_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id as string);
  return data as AdminSession;
}

export async function revokeAdminSession(params: {
  admin: AdminClient;
  rawToken: string;
}): Promise<void> {
  const hash = hashSessionToken(params.rawToken);
  await params.admin
    .from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hash);
}
