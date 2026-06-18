import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReconciliationClient from "./ReconciliationClient";
import BackButton from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: "Réconciliation avec le Corps — KAÏA",
  description: "Un espace doux pour apaiser ta relation à ton corps : douleur, image corporelle, féminité, ménopause.",
};

export default async function ReconciliationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <BackButton href="/cycle" />
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Réconciliation avec le corps
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Quatre chemins doux pour t'apaiser. Prends le temps qu'il te faut.
        </p>
      </div>
      <ReconciliationClient />
      <p className="mt-8 text-[10px] text-[var(--foreground-muted)] leading-relaxed">
        Ces espaces d'exploration sont un soutien bienveillant, pas un suivi thérapeutique.
        Pour une souffrance qui persiste, entoure-toi d'un·e professionnel·le.
      </p>
    </div>
  );
}
