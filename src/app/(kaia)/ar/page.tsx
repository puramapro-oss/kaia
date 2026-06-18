import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ARLandingClient from "./ARLandingClient";

export const metadata: Metadata = { title: "Miroir Énergétique — KAÏA" };

export default async function ARPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enabled = process.env.ENABLE_AR === "true";

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[var(--kaia-moon)]" />
          <h1 className="font-display text-3xl font-semibold gradient-kaia-text">
            Miroir Énergétique
          </h1>
        </div>
        <p className="text-[var(--foreground-muted)] text-sm">
          Une expérience de présence en réalité augmentée. Ni soin, ni diagnostic —
          un moment pour ressentir et te recentrer.
        </p>
      </div>

      <ARLandingClient enabled={enabled} />
    </div>
  );
}
