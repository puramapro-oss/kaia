import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConcoursClient from "./ConcoursClient";

export const metadata: Metadata = { title: "Concours — KAÏA" };

type ContestRow = {
  id: string;
  title: string;
  prize_pool_cents: number;
  end_at: string;
  status: string;
  entries_count: number;
};

export default async function ConcoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const query = (freq: "weekly" | "monthly" | "annual") =>
    supabase
      .from("contests")
      .select("id, title, prize_pool_cents, end_at, status, entries_count")
      .eq("app_slug", "kaia")
      .eq("frequency", freq)
      .eq("status", "open")
      .maybeSingle();

  const [weeklyResult, monthlyResult, annualResult, entriesResult] = await Promise.all([
    query("weekly"),
    query("monthly"),
    query("annual"),
    supabase
      .from("contest_entries")
      .select("contest_id, created_at")
      .eq("user_id", user.id),
  ]);

  const contests: Record<"weekly" | "monthly" | "annual", ContestRow | null> = {
    weekly: weeklyResult.data,
    monthly: monthlyResult.data,
    annual: annualResult.data,
  };

  return <ConcoursClient contests={contests} userEntries={entriesResult.data || []} />;
}
