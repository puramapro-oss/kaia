"use client";

import { useState } from "react";
import { Link2, Copy, Check, Send } from "lucide-react";
import { copyToClipboard, formatRelativeTime } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/transmission/role-labels";
import type { TransmissionRole } from "@/lib/transmission/invite";

export interface TransmissionEntry {
  id: string;
  author_role: TransmissionRole;
  body: string;
  created_at: string;
}

interface Props {
  spaceId: string | null;
  role: TransmissionRole;
  initialEntries: TransmissionEntry[];
  /** Chemin d'invitation déjà généré (owner uniquement). */
  initialInvitePath: string | null;
}

export default function TransmissionSpace({ spaceId, role, initialEntries, initialInvitePath }: Props) {
  const [id, setId] = useState<string | null>(spaceId);
  const [invitePath, setInvitePath] = useState<string | null>(initialInvitePath);
  const [entries, setEntries] = useState<TransmissionEntry[]>(initialEntries);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motherIsSenior, setMotherIsSenior] = useState(false);

  const inviteUrl =
    invitePath && typeof window !== "undefined" ? `${window.location.origin}${invitePath}` : invitePath;

  async function createSpace() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/transmission/space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Âge déclaré ≥ 50 → accès web sans compte autorisé pour l'invitée.
        body: JSON.stringify({ inviteeAge: motherIsSenior ? 50 : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setId(data.spaceId);
      setInvitePath(data.invitePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function addEntry() {
    if (!id || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/transmission/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: id, role, body: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEntries((prev) => [data.entry, ...prev]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  // ── Pas encore d'espace : proposition de création (fille uniquement) ───────────
  if (!id) {
    return (
      <div className="glass rounded-2xl p-6 text-center space-y-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          Crée un espace partagé pour transmettre, écrire et te relier à ta mère ou ta fille.
        </p>
        <label className="flex items-center gap-2 justify-center text-xs text-[var(--foreground-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={motherIsSenior}
            onChange={(e) => setMotherIsSenior(e.target.checked)}
            className="accent-[var(--kaia-moon)]"
          />
          Ma mère a 50 ans ou plus (accès au journal sans créer de compte)
        </label>
        <button
          onClick={createSpace}
          disabled={busy}
          className="px-5 py-3 rounded-full font-medium text-sm gradient-kaia text-[var(--background)] disabled:opacity-60"
        >
          {busy ? "Création…" : "Créer notre espace"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lien d'invitation (owner) */}
      {invitePath && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[var(--kaia-moon)]" />
            <h2 className="font-medium text-sm">Inviter par lien</h2>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">
            Partage ce lien. Si ta mère a 50 ans ou plus, elle peut consulter l'espace sans créer de compte.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs bg-[var(--kaia-soft)] rounded-xl px-3 py-2">{inviteUrl}</code>
            <button
              onClick={copyInvite}
              className="shrink-0 p-2 rounded-xl bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
              aria-label="Copier le lien"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Composer une entrée */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <label className="text-xs text-[var(--foreground-muted)] block">
          Tu écris en tant que <span className="text-[var(--kaia-moon)]">{ROLE_LABEL[role]}</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Une pensée, un souvenir, une question à transmettre…"
          className="w-full resize-none rounded-xl bg-[var(--kaia-soft)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--kaia-moon)]"
        />
        <div className="flex items-center justify-between">
          {error ? <span className="text-xs text-red-400">{error}</span> : <span />}
          <button
            onClick={addEntry}
            disabled={busy || !text.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Partager
          </button>
        </div>
      </div>

      {/* Journal commun */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🌙</p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Votre journal commun est encore vierge. Écris la première transmission.
            </p>
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--kaia-moon)]">{ROLE_LABEL[e.author_role]}</span>
                <span className="text-[10px] text-[var(--foreground-muted)]">{formatRelativeTime(e.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-line">{e.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
