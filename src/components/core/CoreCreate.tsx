"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { CoreEventType } from "@/lib/core/moment-z";

const TYPES: { value: CoreEventType; label: string }[] = [
  { value: "now", label: "Maintenant" },
  { value: "24h", label: "Dans 24h" },
  { value: "7days", label: "Cette semaine" },
];

/** Bouton flottant + formulaire de création d'un événement C.O.R.E. */
export default function CoreCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CoreEventType>("now");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [animalFocus, setAnimalFocus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (title.trim().length < 3) return;
    setSubmitting(true);
    try {
      const now = new Date();
      const startsAt = type === "now" ? now : new Date(now.getTime() + 60 * 60 * 1000);
      const res = await fetch("/api/core/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          startsAt: startsAt.toISOString(),
          animalFocus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Création impossible.");
        return;
      }
      setOpen(false);
      router.push(`/core/${data.eventId}`);
    } catch {
      toast.error("Connexion impossible. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-30"
        aria-label="Créer un événement"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-medium">Nouvel événement</h2>
          <button onClick={() => setOpen(false)} aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={[
                "flex-1 py-2 rounded-xl text-xs font-medium transition-colors",
                type === t.value
                  ? "bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
                  : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)]",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="Titre de l'intention collective"
          className="w-full bg-[var(--kaia-soft)] rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--kaia-moon)]/40"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="Décris l'intention (optionnel)"
          className="w-full bg-[var(--kaia-soft)] rounded-xl px-4 py-3 text-sm mb-3 resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[var(--kaia-moon)]/40"
        />
        <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
          <input type="checkbox" checked={animalFocus} onChange={(e) => setAnimalFocus(e.target.checked)} />
          Inclure un Focus Animal 🐾
        </label>

        <button
          onClick={handleCreate}
          disabled={title.trim().length < 3 || submitting}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer l'événement"}
        </button>
      </div>
    </div>
  );
}
