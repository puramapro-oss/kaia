import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommunauteClient from "./CommunauteClient";

export const metadata: Metadata = { title: "Communauté — KAÏA" };

export default async function CommunautePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, content, reactions_count, comments_count, created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return <CommunauteClient initialPosts={posts || []} />;
}
