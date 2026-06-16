import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Réglages — KAÏA" };

export default async function ReglagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3 mb-2">
        <Link href="/moi" className="p-1.5 glass rounded-xl hover:bg-white/10 transition-all">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Link>
        <h1 className="font-display text-2xl font-semibold">Réglages</h1>
      </header>

      <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
        {[
          { label: "Notifications", hint: "P4" },
          { label: "Langue", hint: "Français (défaut)" },
          { label: "Thème", hint: "Sombre (défaut)" },
          { label: "Données & confidentialité", hint: "P4" },
          { label: "Supprimer mon compte", hint: "P4", danger: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between px-5 py-4">
            <span className={`text-sm ${item.danger ? "text-[var(--kaia-rose)]" : ""}`}>{item.label}</span>
            <span className="text-xs text-[var(--foreground-muted)]">{item.hint}</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
          Compte :{" "}<span className="text-[var(--foreground)]">{user.email}</span>
        </p>
      </div>
    </div>
  );
}
