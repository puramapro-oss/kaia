"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { AD_MIN_BUDGET_TOKENS, AD_MAX_BUDGET_TOKENS, type AdPlacement } from "@/lib/ads/rules";

export default function CreateAdClient({ balance }: { balance: number }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    body: "",
    ctaLabel: "",
    ctaUrl: "",
    placement: "feed" as AdPlacement,
    budgetTokens: AD_MIN_BUDGET_TOKENS,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, body: form.body || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDone(
        data.ad?.moderation_status === "approved"
          ? "Ton annonce est en ligne ✨"
          : "Ton annonce est en cours de validation."
      );
      setTimeout(() => router.push("/ads"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  const affordable = balance >= form.budgetTokens;
  const valid =
    form.title.trim().length >= 3 &&
    form.ctaLabel.trim().length >= 2 &&
    /^https?:\/\//.test(form.ctaUrl) &&
    affordable;

  if (done) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Megaphone className="w-8 h-8 text-[var(--kaia-moon)] mx-auto mb-3" />
        <p className="text-sm">{done}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--foreground-muted)]">
        Solde : <span className="text-[var(--kaia-moon)]">{balance} tokens</span>. Budget débité à la création ;
        chaque diffusion consomme 1 token.
      </p>

      <Field label="Titre">
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={80}
          className="input"
          placeholder="Ce que tu veux promouvoir"
        />
      </Field>
      <Field label="Description (optionnel)">
        <textarea
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          maxLength={280}
          rows={2}
          className="input resize-none"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Texte du bouton">
          <input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} maxLength={30} className="input" placeholder="Découvrir" />
        </Field>
        <Field label="Lien (https://)">
          <input value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} className="input" placeholder="https://" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Emplacement">
          <select value={form.placement} onChange={(e) => set("placement", e.target.value as AdPlacement)} className="input">
            <option value="feed">Fil communauté</option>
            <option value="home">Accueil</option>
          </select>
        </Field>
        <Field label={`Budget (${AD_MIN_BUDGET_TOKENS}–${AD_MAX_BUDGET_TOKENS} tokens)`}>
          <input
            type="number"
            min={AD_MIN_BUDGET_TOKENS}
            max={AD_MAX_BUDGET_TOKENS}
            value={form.budgetTokens}
            onChange={(e) => set("budgetTokens", Math.round(Number(e.target.value)))}
            className="input"
          />
        </Field>
      </div>

      {!affordable && <p className="text-xs text-amber-400">Budget supérieur à ton solde de tokens.</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={submit}
        disabled={busy || !valid}
        className="w-full px-5 py-3 rounded-full font-medium text-sm gradient-kaia text-[var(--background)] disabled:opacity-50"
      >
        {busy ? "Création…" : "Lancer mon annonce"}
      </button>
      <p className="text-[10px] text-[var(--foreground-muted)]">
        Les annonces sont modérées (aucune promesse médicale, aucune incitation à un avis store).
      </p>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          background: var(--kaia-soft);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          box-shadow: 0 0 0 1px var(--kaia-moon);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-[var(--foreground-muted)] mb-1 block">{label}</span>
      {children}
    </label>
  );
}
