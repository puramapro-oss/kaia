"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SetupForm() {
  const [step, setStep] = useState<"pin" | "totp">("pin");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [data, setData] = useState<{
    totpUri: string | null;
    totpSecret: string | null;
    recoveryCodes: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submitPin() {
    setError(null);
    if (pin !== pin2) {
      setError("Les deux PIN ne correspondent pas.");
      return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN = 4 à 8 chiffres uniquement.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, enable2fa: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur.");
        return;
      }
      const j = await res.json();
      setData({
        totpUri: j.totpUri,
        totpSecret: j.totpSecret,
        recoveryCodes: j.recoveryCodes,
      });
      setStep("totp");
    });
  }

  function confirmTotp() {
    setError(null);
    if (!/^\d{6}$/.test(totpCode)) {
      setError("Code TOTP = 6 chiffres.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/setup-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Code invalide.");
        return;
      }
      router.push("/admin/login");
    });
  }

  if (step === "pin") {
    return (
      <div className="space-y-3">
        <label className="block text-xs text-white/60">PIN (4-8 chiffres)</label>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 font-mono text-center text-2xl tracking-widest"
          aria-label="PIN admin"
        />
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={8}
          value={pin2}
          onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
          placeholder="Confirme le PIN"
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 font-mono text-center text-2xl tracking-widest"
          aria-label="Confirme PIN"
        />
        <button
          onClick={submitPin}
          disabled={pending}
          className="w-full rounded-xl bg-amber-300 text-black font-medium py-2.5 hover:bg-amber-200 disabled:opacity-60"
        >
          {pending ? "…" : "Continuer"}
        </button>
        {error && (
          <p className="text-xs text-rose-300" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-black/40 p-3 text-xs">
        <p className="text-white/70 mb-2">
          Scanne ce QR code avec une app TOTP (Authy, 1Password, Google Authenticator).
        </p>
        {data?.totpUri && (
          <a
            href={data.totpUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 underline break-all"
          >
            {data.totpUri}
          </a>
        )}
        <p className="mt-2 text-white/60">Saisie manuelle :</p>
        <code className="font-mono text-white/90 break-all">{data?.totpSecret}</code>
      </div>

      <div className="rounded-lg bg-rose-300/10 border border-rose-300/30 p-3 text-xs">
        <p className="text-rose-200 font-medium mb-2">⚠️ Codes de récupération (à imprimer)</p>
        <ul className="font-mono text-rose-100 space-y-0.5">
          {data?.recoveryCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={totpCode}
        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
        placeholder="Code 6 chiffres"
        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 font-mono text-center text-2xl tracking-widest"
        aria-label="Code TOTP"
      />
      <button
        onClick={confirmTotp}
        disabled={pending}
        className="w-full rounded-xl bg-amber-300 text-black font-medium py-2.5 hover:bg-amber-200 disabled:opacity-60"
      >
        {pending ? "…" : "Confirmer 2FA"}
      </button>
      {error && (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
