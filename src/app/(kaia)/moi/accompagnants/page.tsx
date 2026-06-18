import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CaregiverDashboard from "@/components/caregiver/CaregiverDashboard";
import BackButton from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Accompagnants — KAÏA" };

const UNLOCKED_PLANS = new Set(["infini", "legende"]);

export default async function AccompagnantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, referral_code")
    .eq("id", user.id)
    .single();

  const unlocked = UNLOCKED_PLANS.has(profile?.plan ?? "free");

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <BackButton href="/moi" />
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Espace Accompagnants
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Soutenir une proche dans son cycle, sans t&apos;oublier toi-même
        </p>
      </div>

      <CaregiverDashboard unlocked={unlocked} inviteCode={profile?.referral_code ?? user.id.slice(0, 8)} />
    </div>
  );
}
