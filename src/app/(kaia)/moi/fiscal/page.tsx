import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FiscalClient from "./FiscalClient";

export const metadata: Metadata = { title: "Fiscal — KAÏA" };

const sum = (rows: { [k: string]: number | null }[] | null, key: string) =>
  (rows ?? []).reduce((acc, r) => acc + (r[key] ?? 0), 0);

export default async function FiscalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: shares }, { data: primes }, { data: commissions }] = await Promise.all([
    supabase.from("karma_user_shares").select("share_amount_cents").eq("user_id", user.id),
    supabase.from("primes").select("amount_cents").eq("user_id", user.id).not("paid_at", "is", null),
    supabase.from("referral_commissions").select("commission_cents").eq("referrer_user_id", user.id).eq("status", "paid"),
  ]);

  return (
    <FiscalClient
      karmaCents={sum(shares, "share_amount_cents")}
      primesCents={sum(primes, "amount_cents")}
      referralCents={sum(commissions, "commission_cents")}
    />
  );
}
