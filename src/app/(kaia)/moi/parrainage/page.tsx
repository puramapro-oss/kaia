import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ParrainageClient from "./ParrainageClient";

export const metadata: Metadata = { title: "Parrainage — KAÏA" };

export default async function ParrainagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: referrals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("referral_code, referrals_count, total_earnings_cents")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("referrals")
      .select("id, status, created_at, total_commission_cents")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const referralCode = profile?.referral_code || user.id.slice(0, 8);
  const referralLink = `https://kaia.purama.dev/go/${referralCode}`;

  const totalReferrals = referrals?.length || 0;
  const totalEarnings = referrals?.reduce((sum, r) => sum + (r.total_commission_cents || 0), 0) || 0;

  return (
    <ParrainageClient
      referralLink={referralLink}
      totalReferrals={totalReferrals}
      totalEarnings={totalEarnings / 100}
      recentReferrals={referrals || []}
    />
  );
}
