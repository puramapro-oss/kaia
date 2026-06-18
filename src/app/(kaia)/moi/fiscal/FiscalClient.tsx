"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import {
  detectFiscalProfile,
  summarizeAnnualRevenue,
  type EmploymentStatus,
} from "@/lib/fiscal/profiles";
import { estimateUrssafContribution } from "@/lib/fiscal/urssaf";
import { formatPrice } from "@/lib/utils";
import BackButton from "@/components/ui/BackButton";

const STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: "student", label: "Étudiant·e" },
  { value: "employee", label: "Salarié·e" },
  { value: "freelance", label: "Auto-entrepreneur·e" },
  { value: "portage", label: "Portage" },
];

const eur = (cents: number) => formatPrice(cents);

export default function FiscalClient({
  karmaCents,
  primesCents,
  referralCents,
}: {
  karmaCents: number;
  primesCents: number;
  referralCents: number;
}) {
  const [status, setStatus] = useState<EmploymentStatus>("employee");

  const profile = useMemo(() => detectFiscalProfile({ employmentStatus: status }), [status]);
  // Props serveur stables après montage → pas de useMemo nécessaire.
  const summary = summarizeAnnualRevenue({ karmaCents, primesCents, referralCents });
  const urssaf = profile.key === "freelance_ae" ? estimateUrssafContribution(summary.totalCents) : null;

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28 space-y-6">
      <BackButton href="/moi" />

      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-[var(--kaia-moon)]" />
          <h1 className="font-display text-3xl font-semibold gradient-kaia-text">Mon fiscal</h1>
        </div>
        <p className="text-[var(--foreground-muted)] text-sm">
          Récapitulatif indicatif de tes revenus KAÏA. Ce n&apos;est pas un conseil fiscal.
        </p>
      </div>

      <div className="glass rounded-2xl p-5">
        <label className="text-xs text-[var(--foreground-muted)] mb-2 block">Mon statut</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              className={[
                "px-4 py-2 rounded-full text-xs font-medium transition-colors",
                status === o.value
                  ? "bg-[var(--kaia-moon)]/20 text-[var(--kaia-moon)]"
                  : "bg-[var(--kaia-soft)] text-[var(--foreground-muted)]",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--kaia-moon)]/10">
          <p className="font-medium text-sm">{profile.label}</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">{profile.description}</p>
          <p className="text-xs text-[var(--kaia-gold)] mt-2">{profile.revenueRegime}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-medium mb-4">Revenus KAÏA cette année</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">KARMA</span><span>{eur(summary.karmaCents)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Primes</span><span>{eur(summary.primesCents)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Parrainage</span><span>{eur(summary.referralCents)}</span></div>
          <div className="flex justify-between font-medium pt-2 border-t border-[var(--kaia-moon)]/10"><span>Total</span><span className="gradient-kaia-text">{eur(summary.totalCents)}</span></div>
          <div className="flex justify-between text-xs text-[var(--foreground-muted)]"><span>Base imposable estimée (micro-BNC −34%)</span><span>{eur(summary.microBncTaxableCents)}</span></div>
          {urssaf && (
            <div className="flex justify-between text-xs text-[var(--foreground-muted)]"><span>Cotisations URSSAF estimées ({urssaf.ratePct}%)</span><span>{eur(urssaf.contributionCents)}</span></div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
        Estimations fournies à titre informatif (régime micro-BNC). Rapproche-toi
        d&apos;un·e expert·e-comptable ou des impôts pour ta situation réelle.
      </p>
    </div>
  );
}
