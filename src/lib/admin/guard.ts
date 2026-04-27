/**
 * Helper utilisé par toutes les routes API admin :
 *  - vérifie session Supabase
 *  - vérifie isAdminEmail
 *  - vérifie cookie admin_session valide DB-side
 *  - retourne user + admin client
 */
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ADMIN_SESSION_COOKIE, isAdminEmail } from "./auth";
import { findAdminSession } from "./session";

export interface AdminGuardOk {
  ok: true;
  userId: string;
  email: string;
  admin: ReturnType<typeof createServiceClient>;
  ip: string | null;
}

export interface AdminGuardKo {
  ok: false;
  status: number;
  error: string;
}

export async function requireAdmin(): Promise<AdminGuardOk | AdminGuardKo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Non authentifié." };
  if (!isAdminEmail(user.email)) {
    return { ok: false, status: 403, error: "Forbidden." };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { ok: false, status: 401, error: "Session admin requise." };
  const adminClient = createServiceClient();
  const session = await findAdminSession({ admin: adminClient, rawToken: token });
  if (!session || session.user_id !== user.id) {
    return { ok: false, status: 401, error: "Session admin invalide." };
  }
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return {
    ok: true,
    userId: user.id,
    email: user.email!,
    admin: adminClient,
    ip,
  };
}
