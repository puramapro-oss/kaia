import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { detectPhase, getCycleDay, type CyclePhase } from "@/lib/cycle/phases";
import RituelsClient from "./RituelsClient";

export const metadata: Metadata = { title: "Rituels Cycliques — KAÏA" };

export default async function RituelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cycle_start_date, cycle_duration")
    .eq("id", user.id)
    .single();

  // Phase courante (défaut folliculaire si cycle non renseigné).
  let currentPhase: CyclePhase = "folliculaire";
  if (profile?.cycle_start_date) {
    const day = getCycleDay(new Date(profile.cycle_start_date));
    currentPhase = detectPhase(day, profile.cycle_duration || 28).phase;
  }

  return <RituelsClient currentPhase={currentPhase} />;
}
