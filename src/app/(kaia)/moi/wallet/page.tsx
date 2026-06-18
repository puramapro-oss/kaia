import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WalletClient from "./WalletClient";

export const metadata: Metadata = { title: "Wallet — KAÏA" };

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: shares }, { data: wallet }, { data: profile }] = await Promise.all([
    supabase.from("karma_user_shares").select("share_amount_cents, paid_at").eq("user_id", user.id),
    supabase.from("graines_wallet").select("balance_graines").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("stripe_connect_account_id").eq("id", user.id).single(),
  ]);

  // Solde retirable = parts KARMA non encore versées.
  const balanceCents = (shares ?? [])
    .filter((s) => !s.paid_at)
    .reduce((sum, s) => sum + (s.share_amount_cents ?? 0), 0);

  return (
    <WalletClient
      balanceCents={balanceCents}
      grainesBalance={wallet?.balance_graines ?? 0}
      connectOnboarded={!!profile?.stripe_connect_account_id}
    />
  );
}
