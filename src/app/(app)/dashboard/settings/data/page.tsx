"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DataPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/account/export-data", { method: "POST" });
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        alert(
          data.message ??
            "Export en cours. Tu recevras un email avec tes données dans quelques minutes.",
        );
      } else {
        alert(data.error ?? "Impossible de lancer l'export.");
      }
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "SUPPRIMER") return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/request-deletion", { method: "POST" });
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        alert(
          data.message ??
            "Demande de suppression enregistrée. Ton compte sera supprimé dans 30 jours.",
        );
        setShowConfirm(false);
      } else {
        alert(data.error ?? "Impossible de lancer la suppression.");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-[var(--color-kaia-accent)]/80">
          Réglages
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Mes données
        </h1>
        <p className="text-white/55">
          Télécharge ou supprime tes données personnelles. Tes droits RGPD.
        </p>
      </header>

      {/* Export */}
      <GlassCard className="space-y-4">
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--color-kaia-green-soft)26", color: "var(--color-kaia-green-soft)" }}
          >
            <Download className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg text-white">Exporter mes données</p>
            <p className="text-sm text-white/55 mt-0.5">
              Reçois un email avec l'ensemble de tes données (profil, routines, sessions,
              Graines, historique) au format JSON.
            </p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={exportLoading}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          {exportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exportLoading ? "Préparation…" : "Exporter mes données"}
        </Button>
      </GlassCard>

      {/* Delete */}
      <GlassCard className="space-y-4 border-red-500/20">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <Trash2 className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg text-white">Supprimer mon compte</p>
            <p className="text-sm text-white/55 mt-0.5">
              Suppression définitive sous 30 jours. Toutes tes données seront effacées de nos
              serveurs. Cette action est irréversible.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Demander la suppression de mon compte
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Tape <strong>SUPPRIMER</strong> pour confirmer.</span>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-red-400/50 focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== "SUPPRIMER" || deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmer la suppression
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="text-sm text-white/55 leading-relaxed space-y-2">
        <p>
          <strong className="text-white/80">Droit d'accès (art. 15 RGPD) :</strong> l'export
          ci-dessus contient toutes tes données personnelles.
        </p>
        <p>
          <strong className="text-white/80">Droit à l'effacement (art. 17 RGPD) :</strong> la
          suppression de compte efface définitivement toutes tes données dans les 30 jours.
        </p>
        <p>
          Contact DPO : <a href="mailto:privacy@purama.dev" className="text-[var(--color-kaia-accent)] underline">privacy@purama.dev</a>
        </p>
      </GlassCard>
    </div>
  );
}
