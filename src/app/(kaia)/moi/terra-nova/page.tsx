import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TerraNovaClient from "./TerraNovaClient";

export const metadata: Metadata = { title: "TERRA NOVA — KAÏA" };

export default async function TerraNovaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: wallet }, { data: nodes }] = await Promise.all([
    supabase
      .from("graines_wallet")
      .select("balance_graines, total_earned, kyc_completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("terra_nova_nodes").select("id, lat, lng, meeting_type").limit(500),
  ]);

  return (
    <TerraNovaClient
      nodes={nodes ?? []}
      balance={wallet?.balance_graines ?? 0}
      totalEarned={wallet?.total_earned ?? 0}
      kycCompleted={!!wallet?.kyc_completed_at}
    />
  );
}
