import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MissionsClient from "./MissionsClient";

export const metadata: Metadata = { title: "Missions — KAÏA" };

export default async function MissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: missions } = await supabase
    .from("missions")
    .select("*")
    .eq("active", true)
    .order("type");

  const { data: completions } = await supabase
    .from("mission_completions")
    .select("mission_id, status, created_at")
    .eq("user_id", user.id);

  return <MissionsClient missions={missions || []} completions={completions || []} />;
}
