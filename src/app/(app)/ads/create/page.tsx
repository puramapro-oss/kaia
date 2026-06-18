import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateAdClient from "./CreateAdClient";

export const metadata: Metadata = { title: "Créer une annonce — KAÏA" };

export default async function CreateAdPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tokens } = await supabase
    .from("user_tokens")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-1">Promouvoir avec mes tokens</h1>
      <p className="text-[var(--foreground-muted)] text-sm mb-6">
        Mets en avant ton projet auprès de la communauté KAÏA.
      </p>
      <CreateAdClient balance={tokens?.balance ?? 0} />
    </div>
  );
}
