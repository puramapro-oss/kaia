"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginTotpForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/login-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: code }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Code invalide.");
        return;
      }
      router.push("/admin");
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-white/60">Code 2FA (6 chiffres)</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        autoFocus
        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 font-mono text-center text-2xl tracking-widest"
        aria-label="Code TOTP"
      />
      <button
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl bg-amber-300 text-black font-medium py-2.5 hover:bg-amber-200 disabled:opacity-60"
      >
        {pending ? "…" : "Valider"}
      </button>
      {error && (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
