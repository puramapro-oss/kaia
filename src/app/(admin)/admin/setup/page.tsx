import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/auth";
import { SetupForm } from "@/components/admin/SetupForm";

export const metadata = { title: "Admin setup — KAÏA", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/setup");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("admin_credentials")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/admin/login");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0F]">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.04] border border-white/[0.08] p-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-amber-300" />
          <h1 className="font-display text-2xl">Setup initial admin</h1>
        </div>
        <p className="text-sm text-white/60 mb-6">
          Première fois sur l&apos;espace admin. On crée ton PIN puis on active 2FA TOTP.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
