import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/auth";
import { LoginPinForm } from "@/components/admin/LoginPinForm";
import { LoginTotpForm } from "@/components/admin/LoginTotpForm";
import { cookies } from "next/headers";
import { ADMIN_PRE2FA_COOKIE } from "@/lib/admin/auth";

export const metadata = { title: "Admin login — KAÏA", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const sp = await searchParams;
  const admin = createServiceClient();
  const { data: creds } = await admin
    .from("admin_credentials")
    .select("totp_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creds) redirect("/admin/setup");

  const cookieStore = await cookies();
  const has2faCookie = Boolean(cookieStore.get(ADMIN_PRE2FA_COOKIE)?.value);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0F]">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.04] border border-white/[0.08] p-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-amber-300" />
          <h1 className="font-display text-2xl">Admin lockdown</h1>
        </div>
        <p className="text-sm text-white/60 mb-6">{user.email}</p>

        {sp.reason === "expired" && (
          <div className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100 text-xs">
            Session expirée — reconnecte-toi.
          </div>
        )}

        {sp.reason === "pin_failed" && (
          <div className="mb-4 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-rose-200 text-xs">
            PIN incorrect.
          </div>
        )}

        {sp.reason === "totp_failed" && (
          <div className="mb-4 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-rose-200 text-xs">
            Code 2FA incorrect.
          </div>
        )}

        {has2faCookie && creds.totp_enabled ? (
          <LoginTotpForm />
        ) : (
          <LoginPinForm totpEnabled={Boolean(creds.totp_enabled)} />
        )}

        <p className="mt-6 text-xs text-white/40">
          <Link href="/dashboard" className="hover:text-white/60 underline">
            Retour app
          </Link>
        </p>
      </div>
    </div>
  );
}
