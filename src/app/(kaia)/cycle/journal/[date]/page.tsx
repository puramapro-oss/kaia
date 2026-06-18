import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { decryptCycleNote } from "@/lib/crypto/cycle-encrypt";

export const metadata: Metadata = { title: "Journal — KAÏA" };

const MOOD_LABELS: Record<number, string> = {
  1: "😫 Difficile",
  2: "😔 Bas",
  3: "😐 Neutre",
  4: "😊 Bien",
  5: "🥰 Radieuse",
};

const FLOW_LABELS: Record<number, string> = {
  0: "Aucun flux",
  1: "Léger",
  2: "Moyen",
  3: "Abondant",
  4: "Très abondant",
};

interface Props {
  params: Promise<{ date: string }>;
}

export default async function JournalDatePage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entry } = await supabase
    .from("cycle_journal")
    .select("mood, energy, flow_intensity, symptoms, notes")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (!entry) notFound();

  const displayDate = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const decryptedNotes = entry.notes ? decryptCycleNote(entry.notes) : null;

  return (
    <div className="px-5 py-8 max-w-xl mx-auto space-y-5">
      <header className="flex items-center gap-3 mb-2">
        <Link
          href="/cycle"
          className="p-1.5 glass rounded-xl hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Link>
        <div>
          <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest">
            Journal
          </p>
          <h1 className="font-display text-xl font-semibold capitalize">{displayDate}</h1>
        </div>
      </header>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Humeur</p>
            <p className="text-lg">{MOOD_LABELS[entry.mood] ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Énergie</p>
            <div className="flex gap-1 justify-end">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="w-2 h-5 rounded-full transition-all"
                  style={{
                    background:
                      i < entry.energy
                        ? "var(--kaia-moon)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {typeof entry.flow_intensity === "number" && (
          <div>
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Flux</p>
            <p className="text-sm">{FLOW_LABELS[entry.flow_intensity] ?? "—"}</p>
          </div>
        )}

        {Array.isArray(entry.symptoms) && entry.symptoms.length > 0 && (
          <div>
            <p className="text-xs text-[var(--foreground-muted)] mb-2">Symptômes</p>
            <div className="flex flex-wrap gap-2">
              {(entry.symptoms as string[]).map((s: string) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(200,185,240,0.12)",
                    border: "1px solid rgba(200,185,240,0.2)",
                    color: "var(--kaia-moon)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {decryptedNotes && (
          <div>
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Notes</p>
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
              {decryptedNotes}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/cycle/journal"
        className="
          block w-full text-center py-3 rounded-2xl glass
          text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]
          transition-all
        "
      >
        Ajouter une entrée aujourd&apos;hui
      </Link>
    </div>
  );
}
