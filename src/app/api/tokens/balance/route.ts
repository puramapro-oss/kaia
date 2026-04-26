import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DAILY_TOKEN_CAP } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_tokens")
    .select("balance, lifetime_earned, lifetime_spent, daily_earned, daily_earned_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Solde indisponible pour le moment.", details: error.message },
      { status: 500 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const dailyEarned = data?.daily_earned_at === today ? (data?.daily_earned ?? 0) : 0;

  return NextResponse.json({
    balance: data?.balance ?? 0,
    lifetimeEarned: data?.lifetime_earned ?? 0,
    lifetimeSpent: data?.lifetime_spent ?? 0,
    dailyEarned,
    dailyCap: DAILY_TOKEN_CAP,
    dailyRemaining: Math.max(0, DAILY_TOKEN_CAP - dailyEarned),
  });
}
