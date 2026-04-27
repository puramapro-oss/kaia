"use client";

/**
 * PayoutRequestForm — bouton + IBAN field, POST /api/influencer/payout-request.
 */
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  availableCents: number;
}

export function PayoutRequestForm({ availableCents }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const maxEur = Math.floor(availableCents / 100);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amountEur = Number(fd.get("amountEur"));
    const iban = (fd.get("iban") as string)?.replace(/\s+/g, "").toUpperCase() ?? "";
    if (!Number.isFinite(amountEur) || amountEur < 50) {
      setError("Montant minimum : 50 €.");
      return;
    }
    if (amountEur > maxEur) {
      setError(`Montant supérieur au disponible (${maxEur} €).`);
      return;
    }
    start(async () => {
      const res = await fetch("/api/influencer/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: amountEur * 100, iban }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Demande impossible.");
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  if (success) {
    return (
      <p className="text-sm text-[var(--color-kaia-accent)]">
        Demande enregistrée. Tu recevras un mail dès qu'elle est versée.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="amountEur">
          Montant en euros
        </label>
        <input
          id="amountEur"
          name="amountEur"
          type="number"
          min={50}
          max={maxEur}
          step={1}
          required
          defaultValue={maxEur}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-[0.18em] text-white/50 mb-2" htmlFor="iban">
          IBAN
        </label>
        <input
          id="iban"
          name="iban"
          type="text"
          required
          minLength={14}
          maxLength={42}
          placeholder="FR76 1234 5678 9012 3456 7890 123"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono uppercase placeholder:text-white/30 focus:outline-none focus:border-[var(--color-kaia-accent)] wellness-anim"
        />
        <p className="text-xs text-white/40 mt-1">Stocké en clair seulement le temps du virement.</p>
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-kaia-terracotta)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] hover:opacity-95 wellness-anim disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Demander le versement"}
      </button>
    </form>
  );
}
